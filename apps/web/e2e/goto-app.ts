import { expect, type Page } from "@playwright/test";

export type GotoAppInput = { page: Page; path: string; locale?: "sv" | "en" };

/**
 * Opens an app page of the active organization (ADR 0062): `/:locale` redirects to
 * `/:locale/:org`, which gives the slug, then `path` (e.g. `/venues`) is opened under it.
 */
export async function gotoApp({ page, path, locale = "sv" }: GotoAppInput) {
  await page.goto(`/${locale}`);
  await expect(page).toHaveURL(new RegExp(`/${locale}/[^/?#]+$`));
  const slug = new URL(page.url()).pathname.split("/")[2];
  await page.goto(`/${locale}/${slug}${path === "/" ? "" : path}`);
}
