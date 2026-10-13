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

export async function createVenue({ page, name, city }: PageInput & { name: string; city: string }) {
  await page.getByRole("button", { name: "Skapa anläggning" }).first().click();
  await page.getByLabel("Namn").fill(name);
  await page.getByLabel("Ort").fill(city);
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();
}

export async function addRoom({ page, name, capacity }: PageInput & { name: string; capacity: string }) {
  await page.getByRole("button", { name: "Skapa rum" }).first().click();
  await page.getByLabel("Namn").fill(name);
  await page.getByLabel("Max antal personer").fill(capacity);
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible();
}
