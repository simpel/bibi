import { expect, test } from "@playwright/test";
import {
  addItem,
  createItemType,
  createOrganization,
  createVenue,
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
    type: "Conference room",
    name: item,
    numberField: "Max guests",
    value: "40",
    venue: VENUE,
  });
  await page.goto("/sv/venues");
  await page.getByRole("link", { name: VENUE }).click();
  await expect(page.getByRole("link", { name: item })).toBeVisible();

  await page.getByRole("link", { name: "Tillbaka" }).click();
  await page.getByRole("searchbox", { name: "Semantisk sökning" }).fill("Solvik");
  await expect(page.getByText("1 träff").or(page.getByText(/\d+ träffar/))).toBeVisible();

  await page.getByRole("button", { name: "Språk" }).click();
  await page.getByRole("menuitem", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/venues/);
  await expect(page.getByRole("button", { name: "Create venue" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Archive venue" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Archive venue" }).click();
  await expect(page.getByText("No venues yet.")).toBeVisible();
});

test("theme toggle, localized validation messages and mapped sign-in errors", async ({ page }) => {
  const credentials = uniqueCredentials();
  await signUp({ page, credentials });
  await createOrganization({ page, name: "Validering AB" });

  await page.getByRole("button", { name: "Tema" }).click();
  await page.getByRole("menuitem", { name: "Mörkt" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Skapa anläggning" }).first().click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByText("Fältet är obligatoriskt.")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Användarmeny" }).click();
  await page.getByRole("menuitem", { name: "Logga ut" }).click();
  await expect(page).toHaveURL(/\/sv\/login/);

  await page.getByLabel("E-post").fill(credentials.email);
  await page.getByRole("textbox", { name: "Lösenord" }).fill("wrong-password-123");
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page.getByText("Fel e-postadress eller lösenord.")).toBeVisible();

  // Better Auth rate-limits sign-in (3 per 10 s); wait out the window before the valid attempt.
  await page.waitForTimeout(10_500);
  await page.getByRole("textbox", { name: "Lösenord" }).fill(credentials.password);
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page).toHaveURL(/\/sv\/venues$/);
});
