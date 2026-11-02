import { expect, type Page } from "@playwright/test";

type PageInput = { page: Page };

/** Step 1 by search: type part of the name, pick the customer; step 2 opens with its contact. */
export async function pickCustomer({
  page,
  search,
  name,
}: PageInput & { search: string; name: string }) {
  await page.getByPlaceholder("Search customers by name").fill(search);
  // Wait for the result itself: "+ New customer" also contains the typed text.
  await page.getByRole("option", { name, exact: true }).click();
  await expectStep({ page, step: "when" });
  await expect(page.getByText(/Linnea Kvist/).first()).toBeVisible();
}

/** The open step is in the path: `/new/ticket/<step>` (step 1 is the bare `/new/ticket`). */
export async function expectStep({ page, step }: PageInput & { step: string }) {
  await expect(page).toHaveURL(new RegExp(`/new/ticket/${step}(\\?.*)?$`));
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
  await page.getByRole("button", { name: "Next: packages" }).click();
}

/** Step 3: a package card by name, then on to review. */
export async function pickPackage({ page, name }: PageInput & { name: string }) {
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByText(/^Picked:/)).toBeVisible();
  await page.getByRole("button", { name: "Next: review" }).click();
}

/** Create, then the ticket page opens (a ticket id in the path). */
export async function createTicket({ page }: PageInput) {
  await page.getByRole("button", { name: /^Create( ticket| and prebook)?$/ }).click();
  await expect(page).toHaveURL(/\/en\/[^/]+\/tickets\/[^/]+$/, { timeout: 20_000 });
}

/** The intake page of the active organization, in English (labels in `ticketIntake`). */
export const INTAKE_PATH = "/new/ticket";
