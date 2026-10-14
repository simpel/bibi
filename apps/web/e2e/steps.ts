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
  await expect(page).toHaveURL(/\/sv\/venues$/);
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

export async function addRoom({
  page,
  name,
  capacity,
}: PageInput & { name: string; capacity: string }) {
  await page.getByRole("button", { name: "Skapa rum" }).first().click();
  await page.getByLabel("Namn").fill(name);
  await page.getByLabel("Max antal personer").fill(capacity);
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible();
}

export const PANEL = '[data-slot="assistant-panel"]';

/** Sign up + organization in one go; the user ends on the (empty) venue list. */
export async function signUpWithOrganization({ page, name }: PageInput & { name: string }) {
  await signUp({ page, credentials: uniqueCredentials() });
  await createOrganization({ page, name });
}

/** Opens the assistant panel with the keyboard shortcut (Ctrl+J, ⌘J on macOS). */
export async function openAssistant({ page }: PageInput) {
  await page.keyboard.press("Control+j");
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
