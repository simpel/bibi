import { expect, type Page } from "@playwright/test";
import { gotoApp } from "./goto-app";
import { completeProfile, nameOrganization } from "./welcome-steps";

export type Credentials = { name: string; email: string; password: string };

export function uniqueCredentials(): Credentials {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return { name: "E2E Tester", email: `e2e-${stamp}@example.com`, password: "e2e-password-123" };
}

export type PageInput = { page: Page };

/** Sign up with email + password; a new user has no organization, so we land on /welcome. */
export async function signUp({ page, credentials }: PageInput & { credentials: Credentials }) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sv\/login/);
  await page.getByRole("link", { name: "Skapa konto" }).click();
  await page.getByLabel("Namn").fill(credentials.name);
  await page.getByLabel("E-post").fill(credentials.email);
  await page.getByLabel("Lösenord").fill(credentials.password);
  await page.getByRole("button", { name: "Skapa konto" }).click();
  // Sign-up creates the account and session before redirecting; slow under load.
  await expect(page).toHaveURL(/\/sv\/welcome$/, { timeout: 15_000 });
}

/**
 * Creates an organization through the welcome flow (ADR 0061): name, profile, hours, then
 * "Skip for now" on the setup, so the steps that follow start from the empty venue list.
 */
export async function createOrganization({ page, name }: PageInput & { name: string }) {
  const slug = await nameOrganization({ page, name });
  await completeProfile({ page, slug });
  await expect(page).toHaveURL(new RegExp(`/sv/${slug}/welcome/setup/organization$`));
  await page.getByRole("button", { name: "Hoppa över just nu" }).click();
  await expect(page).toHaveURL(new RegExp(`/sv/${slug}/pipeline$`));
  await gotoApp({ page, path: "/venues" });
  await expect(page.getByText("Inga anläggningar ännu.")).toBeVisible();
}

export async function createVenue({
  page,
  name,
  city,
}: PageInput & { name: string; city: string }) {
  // Create is a step page (/new/venue): name, address, then contact details.
  await page.getByRole("link", { name: "Skapa anläggning" }).first().click();
  await page.getByLabel("Namn").fill(name);
  await page.getByRole("button", { name: "Nästa" }).click();
  await page.getByLabel("Ort").fill(city);
  await page.getByRole("button", { name: "Nästa" }).click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await gotoApp({ page, path: "/venues" });
  await expect(page.getByRole("link", { name })).toBeVisible();
}

/** Creates an item type with the "Bokningsbar" capability and one number field on its page. */
export async function createItemType({
  page,
  name,
  numberField,
}: PageInput & { name: string; numberField: string }) {
  await gotoApp({ page, path: "/settings/types" });
  // Create is a step page (/new/type): base and name, then capabilities; it opens the new type.
  await page.getByRole("link", { name: "Skapa typ" }).first().click();
  await page.getByLabel("Namn").fill(name);
  await page.getByRole("button", { name: "Nästa" }).click();
  await page.getByRole("checkbox", { name: "Bokningsbar" }).click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
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
  await gotoApp({ page, path: "/items" });
  await page.getByRole("link", { name: "Skapa artikel" }).first().click();
  await page.getByLabel("Typ", { exact: true }).click();
  await page.getByRole("option", { name: type }).click();
  await page.getByRole("button", { name: "Nästa" }).click();
  await page.getByLabel("Namn").fill(name);
  await page.getByLabel(numberField).fill(value);
  await page.getByLabel("Anläggning").click();
  await page.getByRole("option", { name: venue }).click();
  // A click while the select is still closing lands on its overlay instead of the button.
  await expect(page.getByRole("listbox")).toBeHidden();
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
