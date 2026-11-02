import { expect, type Page } from "@playwright/test";

type PageInput = { page: Page };

/** Step 1 by search: type part of the name, pick the match, go on with its only contact. */
export async function pickCustomer({ page, name }: PageInput & { name: string }) {
  await page.getByPlaceholder("Search customers by name").fill(name);
  await page.getByRole("option", { name }).click();
  await expect(page.getByText("Contact: Linnea Kvist")).toBeVisible();
  await page.getByRole("button", { name: "Next: when" }).click();
}

/** Step 2: a day two months ahead (the calendar is the only way to a date), times and guests. */
export async function fillWhen({
  page,
  day = 15,
  from,
  to,
  guests,
}: PageInput & { day?: number; from: string; to: string; guests: number }) {
  await page.getByRole("button", { name: "Pick a date" }).click();
  const calendar = page.locator('[data-slot="calendar"]');
  const next = calendar.getByRole("button", { name: /next month/i });
  await next.click();
  await next.click();
  await calendar.getByRole("button", { name: new RegExp(`\\b${day}(st|nd|rd|th)\\b`) }).click();
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
