import { expect, test } from "@playwright/test";
import { gotoApp } from "./goto-app";
import {
  addStatus,
  api,
  chip,
  columnBack,
  createTicket,
  dragUntil,
} from "./pipeline-customize-steps";
import { signUpWithOrganization } from "./steps";

// Customize mode on /pipeline (ADR 0067): a new organization has one default board with one
// column per default status (Lead, Confirmed, Completed, Lost).

test("an admin customizes the board: columns, statuses and the unphased column", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Tavla AB" });
  const ticketId = await createTicket({ page });
  await gotoApp({ page, path: "/pipeline" });
  await page.getByRole("link", { name: "Anpassa" }).click();
  await expect(page).toHaveURL(/\/pipeline\?(.*&)?mode=customize/);
  await expect(columnBack({ page, name: "Lost" })).toBeVisible();

  // Reorder a column with the keyboard: lift Lost, move it left, drop it.
  await page.getByRole("button", { name: "Flytta kolumnen Lost" }).focus();
  // dnd-kit listens for the arrow keys only after the lift has settled.
  for (const key of ["Space", "ArrowLeft", "Space"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
  await expect(page.getByText("Kolumnordningen har sparats.").first()).toBeVisible();

  // Drag a status into another column: Lost joins Completed; the Lost column stays, empty.
  await dragUntil({
    page,
    source: chip({ scope: columnBack({ page, name: "Lost" }), name: "Lost" }),
    target: columnBack({ page, name: "Completed" }).locator('[data-slot="kanban-chip-list"]'),
    landed: chip({ scope: columnBack({ page, name: "Completed" }), name: "Lost" }),
  });
  await expect(page.getByText("Ärendestatusen har flyttats.").first()).toBeVisible();

  // Add a column after the last one. A new status lands in the unphased column; drag it in.
  await page.getByRole("button", { name: "Lägg till kolumn", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Namn").fill("Uppföljning");
  await page.getByRole("dialog").getByRole("button", { name: "Spara" }).click();
  await expect(columnBack({ page, name: "Uppföljning" })).toBeVisible();
  const unphased = page.locator('[data-slot="kanban-unphased-column"]');
  await addStatus({ page, scope: unphased, name: "Platsbesök" });
  await expect(chip({ scope: unphased, name: "Platsbesök" })).toBeVisible();
  await dragUntil({
    page,
    source: chip({ scope: unphased, name: "Platsbesök" }),
    target: columnBack({ page, name: "Uppföljning" }).locator('[data-slot="kanban-chip-list"]'),
    landed: chip({ scope: columnBack({ page, name: "Uppföljning" }), name: "Platsbesök" }),
  });
  // The drop shows at once; let its save and refresh finish before opening the next popover.
  await page.waitForLoadState("networkidle");

  // Another new status: into Uppföljning, then off the board again into the unphased column.
  await addStatus({ page, scope: unphased, name: "Reserv" });
  await dragUntil({
    page,
    source: chip({ scope: unphased, name: "Reserv" }),
    target: columnBack({ page, name: "Uppföljning" }).locator('[data-slot="kanban-chip-list"]'),
    landed: chip({ scope: columnBack({ page, name: "Uppföljning" }), name: "Reserv" }),
  });
  await dragUntil({
    page,
    source: chip({ scope: columnBack({ page, name: "Uppföljning" }), name: "Reserv" }),
    target: unphased.locator('[data-slot="kanban-chip-list"]'),
    landed: chip({ scope: unphased, name: "Reserv" }),
  });

  // The new status takes tickets at once (default transitions); archive it with a target.
  const statuses = await api({ page, method: "get", path: "/ticket-statuses" });
  const items = statuses.items as { id: string; name: string }[];
  const visit = items.find((status) => status.name === "Platsbesök");
  await api({
    page,
    method: "post",
    path: `/tickets/${ticketId}/status`,
    data: { statusId: visit?.id },
  });
  await page.reload();
  await page.getByRole("button", { name: "Åtgärder för Platsbesök" }).click();
  await page.getByRole("menuitem", { name: "Arkivera ärendestatus" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox").click();
  // A new status starts on no column, so it may move on only to the closing ones.
  await page.getByRole("option", { name: "Completed" }).click();
  await dialog.getByRole("button", { name: "Arkivera ärendestatus" }).click();
  await expect(page.getByText("Ärendestatusen har arkiverats.").first()).toBeVisible();
  await expect(
    page.locator('[data-slot="kanban-status-chip"]', { hasText: "Platsbesök" }),
  ).toHaveCount(0);

  // Done turns the columns back and leaves customize mode.
  await page.getByRole("button", { name: "Klar" }).click();
  await expect(page).not.toHaveURL(/mode=customize/);
  await expect(page.getByRole("link", { name: "Anpassa" })).toBeVisible();
  // The archive moved the ticket to Completed; Uppföljning, left empty, was archived with it.
  const completed = page.locator('[data-slot="kanban-column"][aria-label="Completed"]');
  await expect(completed).toContainText("Nordkust AB");
  await expect(page.locator('[data-slot="kanban-column"][aria-label="Uppföljning"]')).toHaveCount(
    0,
  );
});

test("a member without pipeline:write sees no Configure button", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Medlem AB" });
  const members = await api({ page, method: "get", path: "/members" });
  const me = (members.items as { id: string }[])[0];
  await api({
    page,
    method: "put",
    path: `/permissions/member/${me?.id}`,
    data: { overrides: [{ feature: "pipeline", action: "write", effect: "deny" }] },
  });
  await gotoApp({ page, path: "/pipeline?mode=customize" });
  await expect(page.getByRole("button", { name: "Byt tavla" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Anpassa" })).toHaveCount(0);
  await expect(page.locator('[data-slot="kanban-customize-board"]')).toHaveCount(0);
});
