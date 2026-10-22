import { expect, test } from "@playwright/test";
import { gotoApp } from "./goto-app";
import { createItemType, signUpWithOrganization } from "./steps";

const SETTINGS = "/settings/pipeline";

async function createPhase({
  page,
  name,
  flag,
}: {
  page: import("@playwright/test").Page;
  name: string;
  flag?: string;
}) {
  await gotoApp({ page, path: SETTINGS });
  await page.getByRole("link", { name: "Skapa fas" }).first().click();
  await expect(page).toHaveURL(/\/sv\/[^/]+\/new\/ticket-phase$/);
  await page.getByLabel("Namn").fill(name);
  if (flag) await page.getByRole("checkbox", { name: flag }).click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page).toHaveURL(/\/sv\/[^/]+\/settings\/pipeline$/, { timeout: 15_000 });
  await expect(page.getByRole("cell", { name }).first()).toBeVisible();
}

async function rowAction({
  page,
  row,
  item,
}: {
  page: import("@playwright/test").Page;
  row: string;
  item: string;
}) {
  await page
    .getByRole("row", { name: new RegExp(`^${row}`) })
    .getByRole("button", { name: "Åtgärder" })
    .click();
  await page.getByRole("menuitem", { name: item }).click();
}

test("an admin edits phases and the grid on step pages", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Pipeline AB" });
  await createItemType({ page, name: "Conference room", numberField: "Max guests" });

  // A new organization already has the default phases (Lead, Confirmed, Completed, Lost).
  await createPhase({ page, name: "Cancelled", flag: "Avslutar ärendet" });
  await createPhase({ page, name: "Booked" });
  await createPhase({ page, name: "Spare" });

  await rowAction({ page, row: "Booked", item: "Redigera fas" });
  await expect(page).toHaveURL(/\/sv\/[^/]+\/settings\/pipeline\/[^/]+\/update$/);
  await page.getByLabel("Namn").fill("Reserved");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("cell", { name: "Reserved" }).first()).toBeVisible();

  await rowAction({ page, row: "Spare", item: "Flytta vänster" });
  await expect(page.getByText("Ordningen har sparats.")).toBeVisible();

  await expect(page.getByRole("heading", { name: "Rutnätet" })).toBeVisible();
  await expect(page.getByText("Släpper alla rader").first()).toBeVisible();
  // The grid re-renders after the reorder (router.refresh). Wait for the new order to show, so no
  // later refresh can close the select mid-click, then reopen it until its options show.
  await expect
    .poll(async () =>
      (await page.getByRole("combobox").evaluateAll((els) => els.map((el) => el.ariaLabel ?? "")))
        .filter((label) => /^(Spare|Reserved): /.test(label))
        .map((label) => label.split(":")[0]),
    )
    .toEqual(["Spare", "Reserved"]);
  await page.waitForLoadState("networkidle");
  const cell = page.getByRole("combobox", { name: "Reserved: Conference room" });
  const active = page.getByRole("option", { name: "Active" });
  // Open and pick inside one retried block: a late re-render can close the select between the
  // visibility check and the click.
  await expect(async () => {
    if (!(await active.isVisible())) await cell.click({ timeout: 2_000 });
    await active.click({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await expect(
    page.getByText(
      "När ett ärende går in i Reserved flyttas rader av Conference room till Active.",
    ),
  ).toBeVisible();

  await rowAction({ page, row: "Spare", item: "Arkivera fas" });
  await page.getByRole("dialog").getByRole("button", { name: "Arkivera fas" }).click();
  await expect(page.getByRole("cell", { name: "Spare" })).toHaveCount(0);
});

test("an admin edits item states on step pages", async ({ page }) => {
  await signUpWithOrganization({ page, name: "States AB" });
  await createItemType({ page, name: "Conference room", numberField: "Max guests" });

  await gotoApp({ page, path: "/settings/item-states" });
  await expect(page.getByRole("heading", { name: "Artikelstatusar", level: 1 })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Active" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Skapa status" }).click();
  await expect(page).toHaveURL(/\/sv\/[^/]+\/new\/item-state\?type=/);
  await page.getByLabel("Namn").fill("Prebooked");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page).toHaveURL(/\/sv\/[^/]+\/settings\/item-states$/);
  await expect(page.getByRole("cell", { name: "Prebooked" }).first()).toBeVisible();

  await rowAction({ page, row: "Prebooked", item: "Redigera status" });
  await expect(page).toHaveURL(/\/sv\/[^/]+\/settings\/item-states\/[^/]+\/update$/);
  await page.getByLabel("Namn").fill("Tentative");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("cell", { name: "Tentative" }).first()).toBeVisible();

  await rowAction({ page, row: "Tentative", item: "Redigera övergångar" });
  await page.getByRole("dialog").getByRole("checkbox", { name: "Active" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("row", { name: /^Tentative/ })).toContainText("Active");

  await rowAction({ page, row: "Tentative", item: "Arkivera status" });
  await page.getByRole("dialog").getByRole("button", { name: "Arkivera status" }).click();
  await expect(page.getByRole("cell", { name: "Tentative" })).toHaveCount(0);
});
