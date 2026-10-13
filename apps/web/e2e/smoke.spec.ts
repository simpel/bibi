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
