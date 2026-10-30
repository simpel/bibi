import { expect, type Locator, type Page } from "@playwright/test";

type PageInput = { page: Page };

/** A REST call as the signed-in user (session cookie); loosely typed JSON back. */
export async function api({
  page,
  method,
  path,
  data,
}: PageInput & { method: "get" | "post" | "put"; path: string; data?: object }) {
  const response = await page.request[method](`/api/v1${path}`, { data });
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBe(
    true,
  );
  return (await response.json()) as Record<string, unknown> & { id: string };
}

/**
 * A customer and a ticket assigned to the signed-in user (Completed requires a main assignee);
 * it starts in the entry status, Lead. Returns the ticket id.
 */
export async function createTicket({ page }: PageInput): Promise<string> {
  const members = await api({ page, method: "get", path: "/members" });
  const assigneeId = (members.items as { userId: string }[])[0]?.userId;
  const customerType = await api({
    page,
    method: "post",
    path: "/entity-types",
    data: { base: "CUSTOMER", name: "Company" },
  });
  const ticketType = await api({
    page,
    method: "post",
    path: "/entity-types",
    data: { base: "TICKET", name: "Conference" },
  });
  const customer = await api({
    page,
    method: "post",
    path: "/customers",
    data: { entityTypeId: customerType.id, name: "Nordkust AB" },
  });
  const ticket = await api({
    page,
    method: "post",
    path: "/tickets",
    data: { entityTypeId: ticketType.id, customerId: customer.id, assigneeId },
  });
  return ticket.id;
}

/** The back of a column in customize mode. */
export const columnBack = ({ page, name }: PageInput & { name: string }) =>
  page.locator(`[data-slot="kanban-phase-back"][aria-label="${name}"]`);

/** A status chip's drag handle (the chip's first button; the second opens its menu). */
export const chip = ({ scope, name }: { scope: Page | Locator; name: string }) =>
  scope
    .locator('[data-slot="kanban-status-chip"]')
    .filter({ hasText: name })
    .getByRole("button")
    .first();

/**
 * Drags with the mouse in small steps, past dnd-kit's 5 px activation distance. Waits for the
 * save and the refresh first, so no re-render lands mid-drag.
 */
export async function drag({
  page,
  source,
  target,
}: PageInput & { source: Locator; target: Locator }) {
  await page.waitForLoadState("networkidle");
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("drag: element not visible");
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 12, start.y + 4, { steps: 4 });
  await page.mouse.move(end.x, end.y, { steps: 20 });
  await page.mouse.move(end.x + 2, end.y + 2, { steps: 2 });
  await page.mouse.up();
}

/** Opens "+ Add status" in `scope`, names the status and saves it. */
export async function addStatus({
  page,
  scope,
  name,
}: PageInput & { scope: Locator; name: string }) {
  await scope.getByRole("button", { name: "Lägg till ärendestatus" }).click();
  const form = page.getByRole("dialog");
  await form.getByLabel("Namn").fill(name);
  await form.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByText("Ärendestatusen har skapats.").first()).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
