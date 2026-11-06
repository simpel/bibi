import { expect, test } from "@playwright/test";
import { gotoApp } from "./goto-app";
import {
  addItem,
  createItemType,
  createOrganization,
  createVenue,
  signIn,
  signUp,
  uniqueCredentials,
} from "./steps";

const VENUE = "Herrgården Solvik";

test("sign up, create org, venue, type and item, search, switch locale, archive", async ({
  page,
}) => {
  await signUp({ page, credentials: uniqueCredentials() });
  await createOrganization({ page, name: "E2E Konferens AB" });

  await createVenue({ page, name: VENUE, city: "Göteborg" });
  await page.getByRole("link", { name: VENUE }).click();
  await expect(page.getByRole("heading", { name: VENUE })).toBeVisible();
  await expect(page.getByText("Inga artiklar på den här anläggningen ännu.")).toBeVisible();

  await createItemType({ page, name: "Conference room", numberField: "Max guests" });
  const item = "Grand salon";
  await addItem({
    page,
    name: item,
    numberField: "Max guests",
    value: "40",
    venue: VENUE,
  });
  await gotoApp({ page, path: "/venues" });
  await page.getByRole("link", { name: VENUE }).click();
  await expect(page.getByRole("link", { name: item })).toBeVisible();

  await page.getByRole("link", { name: "Tillbaka" }).click();
  // The list's search filters the table through the URL (`?q=`).
  await page.getByRole("combobox", { name: "Sök" }).fill("Solvik");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/[?&]q=Solvik/);
  await expect(page.getByRole("link", { name: VENUE })).toBeVisible();

  await page.getByRole("button", { name: "Användarmeny" }).click();
  await page.getByRole("menuitem", { name: "Språk" }).click();
  await page.getByRole("menuitem", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/[^/]+\/venues/);
  await expect(page.getByRole("link", { name: "Create venue" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Archive venue" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Archive venue" }).click();
  await expect(page.getByText("No venues yet.")).toBeVisible();
});

test("theme toggle, localized validation messages and sign-in by link", async ({ page }) => {
  const credentials = uniqueCredentials();
  await signUp({ page, credentials });
  await createOrganization({ page, name: "Validering AB" });

  await page.getByRole("button", { name: "Användarmeny" }).click();
  await page.getByRole("menuitem", { name: "Tema" }).click();
  await page.getByRole("menuitem", { name: "Mörkt" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("link", { name: "Skapa anläggning" }).first().click();
  await page.getByRole("button", { name: "Nästa" }).click();
  await expect(page.getByText("Fältet är obligatoriskt.")).toBeVisible();

  await page.getByRole("button", { name: "Användarmeny" }).click();
  await page.getByRole("menuitem", { name: "Logga ut" }).click();
  await expect(page).toHaveURL(/\/sv\/login/);

  await signIn({ page, email: credentials.email });
  await expect(page).toHaveURL(/\/sv\/[^/]+$/);
});
