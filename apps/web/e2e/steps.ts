import { expect, type Page } from "@playwright/test";

export type Credentials = { name: string; email: string; password: string };

export function uniqueCredentials(): Credentials {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return { name: "E2E Tester", email: `e2e-${stamp}@example.com`, password: "e2e-password-123" };
}

export type PageInput = { page: Page };

/** Sign up with email + password; a new user has no organization, so we land on the picker. */
export async function signUp({ page, credentials }: PageInput & { credentials: Credentials }) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sv\/login/);
  await page.getByRole("link", { name: "Skapa konto" }).click();
  await page.getByLabel("Namn").fill(credentials.name);
  await page.getByLabel("E-post").fill(credentials.email);
  await page.getByLabel("Lösenord").fill(credentials.password);
  await page.getByRole("button", { name: "Skapa konto" }).click();
  await expect(page).toHaveURL(/\/sv\/select-organization/);
}

export async function createOrganization({ page, name }: PageInput & { name: string }) {
  await page.getByLabel("Organisationens namn").fill(name);
  await page.getByRole("button", { name: "Skapa organisation" }).click();
  // A new organization continues to the first setup (ADR 0045). The app sends a user with a
  // pending first setup back there (ADR 0046), so skip it; the steps that follow start from the
  // venue list.
  await expect(page).toHaveURL(/\/sv\/onboarding$/);
  await expect(page.locator('[data-slot="assistant-chat"]')).toBeVisible();
  await page.getByRole("button", { name: "Hoppa över just nu" }).click();
  await expect(page).not.toHaveURL(/\/onboarding/);
  await page.goto("/sv/venues");
  await expect(page.getByText("Inga anläggningar ännu.")).toBeVisible();
}

export async function createVenue({
  page,
  name,
  city,
}: PageInput & { name: string; city: string }) {
  await page.getByRole("button", { name: "Skapa anläggning" }).first().click();
  await page.getByLabel("Namn").fill(name);
  await page.getByLabel("Ort").fill(city);
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();
}

/** Creates an item type with the "Bokningsbar" behaviour and one number field on its page. */
export async function createItemType({
  page,
  name,
  numberField,
}: PageInput & { name: string; numberField: string }) {
  await page.goto("/sv/settings/types");
  await page.getByRole("button", { name: "Skapa typ" }).first().click();
  await page.getByLabel("Namn").fill(name);
  await page.getByRole("checkbox", { name: "Bokningsbar" }).click();
  await page.getByRole("button", { name: "Spara" }).click();
  await page.getByRole("link", { name }).click();
  await page.getByRole("button", { name: "Lägg till fält" }).click();
  await page.getByRole("dialog").getByLabel("Namn").fill(numberField);
  await page.getByRole("dialog").getByLabel("Värdetyp").click();
  await page.getByRole("option", { name: "Tal" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("cell", { name: numberField })).toBeVisible();
}

/** Creates an item of a type (with its number field) at a venue, from the catalog. */
export async function addItem({
  page,
  type,
  name,
  numberField,
  value,
  venue,
}: PageInput & { type: string; name: string; numberField: string; value: string; venue: string }) {
  await page.goto("/sv/items");
  await page.getByRole("link", { name: "Skapa artikel" }).first().click();
  await page.getByLabel("Typ", { exact: true }).click();
  await page.getByRole("option", { name: type }).click();
  await page.getByRole("button", { name: "Nästa" }).click();
  await page.getByLabel("Namn").fill(name);
  await page.getByLabel(numberField).fill(value);
  await page.getByLabel("Anläggning").click();
  await page.getByRole("option", { name: venue }).click();
  const next = page.getByRole("button", { name: "Nästa" });
  if (await next.isVisible()) await next.click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();
}

export const PANEL = '[data-slot="assistant-home"]';

/** Sign up + organization in one go; the user ends on the (empty) venue list. */
export async function signUpWithOrganization({ page, name }: PageInput & { name: string }) {
  await signUp({ page, credentials: uniqueCredentials() });
  await createOrganization({ page, name });
}

/** Opens the assistant, which lives on the start page. */
export async function openAssistant({ page }: PageInput) {
  await page.goto("/");
  await expect(page.locator(PANEL)).toBeVisible();
}

/** Types into the assistant's message box and sends with Enter. */
export async function sendChat({ page, text }: PageInput & { text: string }) {
  const box = page
    .locator(PANEL)
    .getByRole("textbox", { name: "Fråga något eller be om hjälp..." });
  await box.fill(text);
  await box.press("Enter");
}

/** Venues of the signed-in user's organization, read through the REST API (session cookie). */
export async function listVenueNames({ page }: PageInput): Promise<string[]> {
  const response = await page.request.get("/api/v1/venues");
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { items: { name: string }[] };
  return body.items.map((venue) => venue.name);
}
