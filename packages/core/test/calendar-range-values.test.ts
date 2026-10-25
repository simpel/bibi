import { describe, expect, it } from "vitest";
import { calendarSetup, range } from "./calendar-range-helpers";
import { testContext } from "./helpers";

const DAY = { from: "2026-11-01", to: "2026-11-01" };
const HOUR_MINOR = 100_000;

/**
 * The setup's hard hold (10–12 local) worth 40 × 270 kr, the item at 1 000 kr an hour, open
 * 08–18 local on Sundays, with the maintenance block 14–15 local taking time too.
 */
async function pricedSetup() {
  const setup = await calendarSetup();
  const { context, line, item } = setup;
  await context.db.line.update({
    where: { id: line.id },
    data: { unitPriceMinor: 27_000, quantity: 40 },
  });
  await context.db.item.update({
    where: { id: item.id },
    data: { priceMinor: HOUR_MINOR, priceUnit: "PER_HOUR" },
  });
  await context.db.hoursDay.create({
    data: {
      organizationId: context.organizationId,
      itemId: item.id,
      weekday: 6,
      startMinute: 8 * 60,
      endMinute: 18 * 60,
    },
  });
  return setup;
}

describe("calendar.range values", () => {
  it("sums booked lines and prices the free time within the item's hours", async () => {
    const { context, item } = await pricedSetup();
    const { values, currency } = await range({ context, input: DAY });
    expect(currency).toBe("SEK");
    expect(values).toEqual([
      {
        itemId: item.id,
        date: "2026-11-01",
        bookedMinor: 40 * 27_000,
        prebookedMinor: 0,
        openMinor: 7 * HOUR_MINOR,
      },
    ]);
  });

  it("falls back to an office day, 08–18, without hours of the item or its venue", async () => {
    const { context, item } = await pricedSetup();
    await context.db.hoursDay.deleteMany({ where: { itemId: item.id } });
    const { values } = await range({ context, input: DAY });
    expect(values[0]?.openMinor).toBe(7 * HOUR_MINOR);
  });

  it("leaves the open value out under a line filter, the lines' without program:read", async () => {
    const { context, line } = await pricedSetup();
    const filtered = await range({ context, input: { ...DAY, ticketId: line.ticketId } });
    expect(filtered.values[0]?.openMinor).toBeNull();
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["read"], item: ["read"] },
    });
    const { values } = await range({ context: reader, input: DAY });
    expect(values[0]).toMatchObject({
      bookedMinor: null,
      prebookedMinor: null,
      openMinor: 700_000,
    });
  });
});
