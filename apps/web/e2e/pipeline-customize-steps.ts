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

const entityType = ({ page, base, name }: PageInput & { base: string; name: string }) =>
  api({ page, method: "post", path: "/entity-types", data: { base, name } });

/** A customer and a contact person who works there (an order needs one, ADR 0081). */
async function createCustomerWithContact({ page }: PageInput) {
  const customerType = await entityType({ page, base: "CUSTOMER", name: "Company" });
  const contactType = await entityType({ page, base: "CONTACT", name: "Person" });
  const customer = await api({
    page,
    method: "post",
    path: "/customers",
    data: { entityTypeId: customerType.id, name: "Nordkust AB" },
  });
  const contact = await api({
    page,
    method: "post",
    path: "/contacts",
    data: { customerId: customer.id, entityTypeId: contactType.id, name: "Elin Berg" },
  });
  return { customerId: customer.id, contactId: contact.id };
}

/**
 * A customer, a contact there and an order assigned to the signed-in user (Completed requires a
 * main assignee); it starts in the entry status, Lead. Returns the order id.
 */
export async function createOrder({ page }: PageInput): Promise<string> {
  const members = await api({ page, method: "get", path: "/members" });
  const assigneeId = (members.items as { userId: string }[])[0]?.userId;
  const orderType = await entityType({ page, base: "ORDER", name: "Conference" });
  const people = await createCustomerWithContact({ page });
  const order = await api({
    page,
    method: "post",
    path: "/orders",
    data: { entityTypeId: orderType.id, ...people, assigneeId },
  });
  return order.id;
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

/**
 * Drags until `landed` shows: the board refreshes after every save, and a drag that starts while
 * it re-renders can be dropped (seen on slower CI runners). A drag that already landed is not redone.
 */
export async function dragUntil({
  page,
  source,
  target,
  landed,
}: PageInput & { source: Locator; target: Locator; landed: Locator }) {
  await expect(async () => {
    if (await landed.isVisible()) return;
    await drag({ page, source, target });
    await expect(landed).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 20_000 });
}

/** Opens "+ Add status" in `scope`, names the status and saves it. */
export async function addStatus({
  page,
  scope,
  name,
}: PageInput & { scope: Locator; name: string }) {
  const form = page.getByRole("dialog");
  // Right after a drag the first click can land while the board re-renders and close again:
  // click until the popover is open.
  await expect(async () => {
    if (await form.isVisible()) return;
    await scope.getByRole("button", { name: "Lägg till bokningsstatus" }).click();
    await expect(form.getByLabel("Namn")).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 20_000 });
  await form.getByLabel("Namn").fill(name);
  await form.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByText("Bokningsstatusen har skapats.").first()).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
