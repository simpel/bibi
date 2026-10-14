import { expect, test } from "@playwright/test";
import { createOrganization, createVenue, signUp, uniqueCredentials } from "./steps";

const VENUE_A = "Venue in Org A";

test("cross-organization isolation: cannot access another org's venue from URL", async ({
  page,
}) => {
  // Org A: sign up user A, create org A, create a venue
  await signUp({ page, credentials: uniqueCredentials() });
  await createOrganization({ page, name: "Organization A" });
  await createVenue({ page, name: VENUE_A, city: "Göteborg" });

  // Get the venue ID from the URL
  await expect(page.getByRole("link", { name: VENUE_A })).toBeVisible();
  const venueUrl = page.url();
  const venueId = venueUrl.split("/").pop();

  // Log out and sign up user B in org B
  await page.getByRole("button", { name: "Användarmenu" }).click();
  await page.getByRole("menuitem", { name: "Logga ut" }).click();
  await expect(page).toHaveURL(/\/sv\/login/);

  // Org B: sign up user B, create org B
  await signUp({ page, credentials: uniqueCredentials() });
  await createOrganization({ page, name: "Organization B" });

  // Try to access the venue from org A - should be not found
  await page.goto(`/sv/venues/${venueId}`);
  // Should show the 404 not found page
  await expect(page.getByText("Vi hittade inte det du letade efter.")).toBeVisible();
});

test("org switcher displays the current organization", async ({ page }) => {
  // This test verifies the org switcher exists and displays the current organization.
  // A full test of switching between orgs would require a user to be in multiple organizations,
  // which would need an invite/membership mechanism. That could be tested separately by either:
  // 1. Adding an e2e helper to programmatically add a user to an org via the API
  // 2. Using the Mailpit API to read invitation emails and click acceptance links

  await signUp({ page, credentials: uniqueCredentials() });
  await createOrganization({ page, name: "Test Organization" });

  // The org switcher should be visible and show the current org
  const orgSwitcher = page.locator('[aria-label="Byta organisation"]');
  await expect(orgSwitcher).toBeVisible();
  await expect(orgSwitcher).toContainText("Test Organization");

  // Verify the switcher opens a menu
  await orgSwitcher.click();
  await expect(page.getByRole("menuitem", { name: "Test Organization" })).toBeVisible();
});
