import { expect, test } from "@playwright/test";
import { createItemType, signUpWithOrganization } from "./steps";

const SETTINGS = "/sv/settings/pipeline";

async function createPhase({
  page,
  name,
  flag,
}: {
  page: import("@playwright/test").Page;
  name: string;
  flag?: string;
}) {
  await page.goto(SETTINGS);
  await page.getByRole("link", { name: "Skapa fas" }).first().click();
  await expect(page).toHaveURL(/\/sv\/new\/ticket-phase$/);
  await page.getByLabel("Namn").fill(name);
  if (flag) await page.getByRole("checkbox", { name: flag }).click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page).toHaveURL(/\/sv\/settings\/pipeline$/);
  await expect(page.getByRole("cell", { name })).toBeVisible();
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
    .getByRole("row", { name: new RegExp(row) })
    .getByRole("button", { name: "Åtgärder" })
    .click();
  await page.getByRole("menuitem", { name: item }).click();
}

test("an admin edits phases and the grid on step pages", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Pipeline AB" });
  await createItemType({ page, name: "Conference room", numberField: "Max guests" });

  await createPhase({ page, name: "Lead", flag: "Nya ärenden startar här" });
  await createPhase({ page, name: "Lost", flag: "Avslutar ärendet" });
  await createPhase({ page, name: "Booked" });
  await createPhase({ page, name: "Spare" });

  await rowAction({ page, row: "Booked", item: "Redigera fas" });
  await expect(page).toHaveURL(/\/sv\/settings\/pipeline\/[^/]+\/update$/);
  await page.getByLabel("Namn").fill("Confirmed");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("cell", { name: "Confirmed" })).toBeVisible();

  await rowAction({ page, row: "Spare", item: "Flytta vänster" });
  await expect(page.getByText("Ordningen har sparats.")).toBeVisible();

  await expect(page.getByRole("heading", { name: "Rutnätet" })).toBeVisible();
  await expect(page.getByText("Släpper alla rader")).toBeVisible();
  await page.getByRole("combobox", { name: "Confirmed: Conference room" }).click();
  await page.getByRole("option", { name: "Active" }).click();
  await expect(
    page.getByText(
      "När ett ärende går in i Confirmed flyttas rader av Conference room till Active.",
    ),
  ).toBeVisible();

  await rowAction({ page, row: "Spare", item: "Arkivera fas" });
  await page.getByRole("dialog").getByRole("button", { name: "Arkivera fas" }).click();
  await expect(page.getByRole("cell", { name: "Spare" })).toHaveCount(0);
});

test("an admin edits item states on step pages", async ({ page }) => {
  await signUpWithOrganization({ page, name: "States AB" });
  await createItemType({ page, name: "Conference room", numberField: "Max guests" });

  await page.goto("/sv/settings/item-states");
  await expect(page.getByRole("heading", { name: "Artikelstatusar", level: 1 })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Active" })).toBeVisible();

  await page.getByRole("link", { name: "Skapa status" }).click();
  await expect(page).toHaveURL(/\/sv\/new\/item-state\?type=/);
  await page.getByLabel("Namn").fill("Prebooked");
  await page.getByLabel("Vad den gör med artikeln").click();
  await page.getByRole("option", { name: "Preliminär reservation" }).click();
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page).toHaveURL(/\/sv\/settings\/item-states$/);
  await expect(page.getByRole("cell", { name: "Prebooked" })).toBeVisible();

  await rowAction({ page, row: "Prebooked", item: "Redigera status" });
  await expect(page).toHaveURL(/\/sv\/settings\/item-states\/[^/]+\/update$/);
  await page.getByLabel("Namn").fill("Tentative");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("cell", { name: "Tentative" })).toBeVisible();

  await rowAction({ page, row: "Tentative", item: "Redigera övergångar" });
  await page.getByRole("dialog").getByRole("checkbox", { name: "Active" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("row", { name: /Tentative/ })).toContainText("Active");

  await rowAction({ page, row: "Tentative", item: "Arkivera status" });
  await page.getByRole("dialog").getByRole("button", { name: "Arkivera status" }).click();
  await expect(page.getByRole("cell", { name: "Tentative" })).toHaveCount(0);
});
