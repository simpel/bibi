import { expect, type Page } from "@playwright/test";

type PageInput = { page: Page };

/** Step 1 by search: type part of the name, pick the customer; step 2 opens with its contact. */
export async function pickCustomer({
  page,
  search,
  name,
}: PageInput & { search: string; name: string }) {
  // While the page streams in, React keeps a hidden copy of the step before swapping it in.
  await page.getByPlaceholder("Search customers by name").filter({ visible: true }).fill(search);
  // Wait for the result itself: "+ New customer" also contains the typed text.
  await page.getByRole("option", { name, exact: true }).click();
  await expectStep({ page, step: "when" });
  await expect(page.getByText(/Linnea Kvist/).first()).toBeVisible();
}

/** Step 1's title-row Create customer: the form, checked for duplicates when it creates. */
export async function startNewCustomer({ page }: PageInput) {
  await page.getByRole("button", { name: "Create customer", exact: true }).click();
}

/** Step 3's Custom booking, under the package tabs: it opens the build step. */
export async function startCustomBooking({ page }: PageInput) {
  await page.getByRole("button", { name: "Custom booking", exact: true }).click();
  await expect(page).toHaveURL(/\/new\/order\/custom/);
}

/** The paste dialog (`/new/order/message`): Read the request; it closes on step 1. */
export async function readRequest({ page }: PageInput) {
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "From a message" })).toBeVisible();
  await dialog.getByRole("button", { name: "Read the request" }).click();
  await expect(dialog).toHaveCount(0, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/new\/order(\?.*)?$/);
}

/** The open step is in the path: `/new/order/<step>` (step 1 is the bare `/new/order`). */
export async function expectStep({ page, step }: PageInput & { step: string }) {
  await expect(page).toHaveURL(new RegExp(`/new/order/${step}(\\?.*)?$`));
}

/** Step 2: a day two months ahead (the calendar is the only way to a date), times and guests. */
export async function fillWhen({
  page,
  day = 15,
  from,
  to,
  guests,
}: PageInput & { day?: number; from: string; to: string; guests: number }) {
  await page.getByRole("button", { name: /^Date\s?\*?$/ }).click();
  const calendar = page.locator('[data-slot="calendar"]');
  const next = calendar.getByRole("button", { name: /next month/i });
  await next.click();
  await next.click();
  await calendar.getByRole("button", { name: new RegExp(`, ${day} \\w+ \\d{4}$`) }).click();
  await page.getByLabel(/^From\s?\*?$/).fill(from);
  await page.getByLabel(/^To\s?\*?$/).fill(to);
  await page.getByLabel(/^Estimated guests/).fill(String(guests));
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

/** Step 3: a package card by name, then on to review. */
export async function pickPackage({ page, name }: PageInput & { name: string }) {
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByText(/^Picked:/)).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

/** Create, then the order page opens (an order id in the path). */
export async function createOrder({ page }: PageInput) {
  await page.getByRole("button", { name: /^Create( order| and prebook)?$/ }).click();
  await expect(page).toHaveURL(/\/en\/[^/]+\/orders\/[^/]+$/, { timeout: 20_000 });
}

/** The intake page of the active organization, in English (labels in `orderIntake`). */
export const INTAKE_PATH = "/new/order";
