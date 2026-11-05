import { expect, type Page } from "@playwright/test";

export type GotoAppInput = { page: Page; path: string; locale?: "sv" | "en" };

const TO_APP = { sv: "Till appen", en: "To the app" } as const;

/**
 * Opens an app page of the active organization (ADR 0062): the public front page `/:locale`
 * (ADR 0073) links to `/:locale/:org` with "To the app", which gives the slug, then `path`
 * (e.g. `/venues`) is opened under it.
 */
export async function gotoApp({ page, path, locale = "sv" }: GotoAppInput) {
  await page.goto(`/${locale}`);
  await page.getByRole("link", { name: TO_APP[locale] }).first().click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/[^/?#]+$`));
  const slug = new URL(page.url()).pathname.split("/")[2];
  await page.goto(`/${locale}/${slug}${path === "/" ? "" : path}`);
}
