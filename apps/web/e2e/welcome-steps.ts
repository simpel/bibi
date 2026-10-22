import { expect, type Page } from "@playwright/test";

export type WelcomePageInput = { page: Page };

/**
 * `/welcome/new` (ADR 0062): names the organization and waits for a free address, taking the
 * suggestion when the name's slug is taken (several specs reuse names). Returns the slug.
 */
export async function nameOrganization({ page, name }: WelcomePageInput & { name: string }) {
  await page.getByRole("link", { name: "Skapa organisation" }).click();
  await expect(page).toHaveURL(/\/sv\/welcome\/new$/);
  await page.getByLabel("Namn").fill(name);
  const free = page.getByText(/är din$/);
  const suggestion = page.getByRole("button", { name: /^Använd \// });
  await expect(free.or(suggestion)).toBeVisible();
  if (await suggestion.isVisible()) await suggestion.click();
  await expect(free).toBeVisible();
  const slug = await page.getByLabel("Adress").inputValue();
  await page.getByRole("button", { name: "Skapa", exact: true }).click();
  return slug;
}

/** Profile (prefilled from the sign-up name) and the default working hours (ADR 0061). */
export async function completeProfile({ page, slug }: WelcomePageInput & { slug: string }) {
  await expect(page).toHaveURL(new RegExp(`/sv/${slug}/welcome/profile$`), { timeout: 15_000 });
  await page.getByLabel("Telefon").fill("+46 70 123 45 67");
  await page.getByRole("button", { name: "Fortsätt" }).click();
  await expect(page).toHaveURL(new RegExp(`/sv/${slug}/welcome/hours$`));
  await expect(page.getByText("Måndag–Fredag")).toBeVisible();
  await page.getByRole("button", { name: "Fortsätt" }).click();
}
