import { expect, test } from "@playwright/test";
import { addRoom, createOrganization, createVenue, signUp, uniqueCredentials } from "./steps";

const VENUE = "Herrgården Solvik";

test("sign up, create org, venue and room, search, switch locale, archive", async ({ page }) => {
  await signUp({ page, credentials: uniqueCredentials() });
  await createOrganization({ page, name: "E2E Konferens AB" });

  await createVenue({ page, name: VENUE, city: "Göteborg" });
  await page.getByRole("link", { name: VENUE }).click();
  await expect(page.getByRole("heading", { name: VENUE })).toBeVisible();
  await expect(page.getByText("Inga rum ännu.")).toBeVisible();
  await addRoom({ page, name: "Stora salongen", capacity: "40" });

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

test("theme toggle switches the dark class", async ({ page }) => {
  await page.goto("/sv/login");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("validation messages are localized and sign-in errors are mapped", async ({ page }) => {
  const credentials = uniqueCredentials();
  await signUp({ page, credentials });
  await createOrganization({ page, name: "Validering AB" });

  await page.getByRole("button", { name: "Skapa anläggning" }).first().click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByText("Fältet är obligatoriskt.")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Användarmeny" }).click();
  await page.getByRole("menuitem", { name: "Logga ut" }).click();
  await expect(page).toHaveURL(/\/sv\/login/);

  await page.getByLabel("E-post").fill(credentials.email);
  await page.getByLabel("Lösenord").fill("fel-losenord-123");
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page.getByText("Fel e-postadress eller lösenord.")).toBeVisible();

  await page.getByLabel("Lösenord").fill(credentials.password);
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page).toHaveURL(/\/sv\/venues$/);
});
