import { expect, test } from "@playwright/test";
import { mailedLink } from "./mailbox";
import { call } from "./payment-fixtures";
import { signUpWithOrganization } from "./steps";
import { daysAhead, publishedDiningRoom } from "./table-booking-fixtures";

// A guest's table booking end to end (ADR 0119): book on the restaurant's page with a kitchen
// need, open the manage link from the confirmation mail, move the time, then cancel. Staff read
// each step back over REST. Without Turnstile keys (CI) the captcha step is skipped.

const MANAGE_LINK = /https?:\/\/\S*\/book\/manage\/[A-Za-z0-9_-]+/;

test("a guest books a table, changes the time from the mailed link and cancels", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Kajen Krog AB" });
  const { slug, values } = await publishedDiningRoom({ page });
  const day = daysAhead({ days: 3 });
  const email = `guest-${Date.now()}@example.com`;
  const bookedAt = new Date();

  await page.goto(`/en/book/${slug}/kajen?party=2&date=${day}`);
  await page.getByRole("button", { name: "18:00" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Anna Lind");
  await page.getByLabel("Phone").fill("070-123 45 67");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "More: Gluten" }).click();
  await page.getByRole("button", { name: "Book table" }).click();
  await expect(page).toHaveURL(/\/book\/manage\/[^/?]+\?booked=1$/);
  await expect(page.getByText("Thanks, Anna Lind! Your table is booked.")).toBeVisible();

  const from = new Date(Date.parse(day) - 86_400_000).toISOString();
  const to = new Date(Date.parse(day) + 2 * 86_400_000).toISOString();
  const listPath = `/reservations?from=${from}&to=${to}`;
  const booked = await call({ page, method: "get", path: listPath });
  const gluten = values.find((value) => value.name === "Gluten");
  expect(booked.items).toEqual([
    expect.objectContaining({
      partySize: 2,
      state: "BOOKED",
      requirements: [{ vocabularyValueId: gluten?.id, quantity: 1 }],
    }),
  ]);
  const bookedStart = Date.parse(String(booked.items[0]?.startsAt));

  // The guest comes back through the confirmation mail, as they would days later.
  await page.goto(await mailedLink({ page, email, sentAfter: bookedAt, pattern: MANAGE_LINK }));
  await page.getByRole("link", { name: "Edit time or guests" }).click();
  await expect(page.getByRole("heading", { name: "Pick a new time" })).toBeVisible();
  await page.getByRole("button", { name: "19:00" }).click();
  await expect(page.getByText("Your booking is changed")).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit time or guests" })).toBeVisible();
  const moved = await call({ page, method: "get", path: listPath });
  expect(moved.items).toHaveLength(1);
  // 18:00 to 19:00 in the room's zone: one hour later.
  expect(Date.parse(String(moved.items[0]?.startsAt)) - bookedStart).toBe(3_600_000);

  await page.getByRole("button", { name: "Cancel booking" }).click();
  await page.getByRole("button", { name: "Yes, cancel booking" }).click();
  await expect(page.getByRole("heading", { name: "Your booking is cancelled" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Book again" })).toBeVisible();
  const left = await call({ page, method: "get", path: listPath });
  expect(left.items).toEqual([]);
});
