import { describe, expect, it } from "vitest";
import { loadHoursWarnings } from "../src/hours/hours-warnings";
import { checkLineHours, createVenue, execute, getItemHours, getVenueHours } from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { createHoldLine } from "./hold-helpers";
import { ALL_DAYS, OFFICE_DAYS, runItemHours, runVenueHours, warningsOf } from "./hours-helpers";
import { createTestItem } from "./item-helpers";
import { createBookableItem } from "./occupancy-helpers";
import { orderSetup } from "./order-helpers";

const CHRISTMAS = {
  date: "2037-12-24",
  startMinute: null,
  endMinute: null,
  breakStartMinute: null,
  breakEndMinute: null,
  note: "Christmas Eve",
};

async function venueSetup() {
  const setup = await orderSetup();
  const input = { name: "Harbour", timeZone: "Europe/London" };
  const venue = unwrap({
    result: await execute({ operation: createVenue, input, context: setup.context }),
  });
  return { ...setup, venue };
}

describe("venue and item hours (ADR 0064 rules 10–11)", () => {
  it("replaces and reads a venue's pattern with a dated exception in the venue's zone", async () => {
    const { context, venue } = await venueSetup();
    const days = [...OFFICE_DAYS].reverse();
    unwrap({
      result: await runVenueHours({ context, venueId: venue.id, days, exceptions: [CHRISTMAS] }),
    });
    const read = await execute({ operation: getVenueHours, input: { venueId: venue.id }, context });
    expect(unwrap({ result: read })).toEqual({
      days: OFFICE_DAYS,
      exceptions: [CHRISTMAS],
      timeZone: "Europe/London",
    });
    unwrap({ result: await runVenueHours({ context, venueId: venue.id, days: [] }) });
    const empty = await execute({
      operation: getVenueHours,
      input: { venueId: venue.id },
      context,
    });
    expect(unwrap({ result: empty })).toEqual({
      days: [],
      exceptions: [],
      timeZone: "Europe/London",
    });
  });

  it("rejects a weekday or date twice, a half-closed exception and a break outside the day", async () => {
    const { context, venue } = await venueSetup();
    const twice = [OFFICE_DAYS[0], OFFICE_DAYS[0]];
    const half = { ...CHRISTMAS, startMinute: 600 };
    const outside = { ...OFFICE_DAYS[0], breakStartMinute: 400 };
    for (const pattern of [
      { days: twice },
      { days: [], exceptions: [CHRISTMAS, CHRISTMAS] },
      { days: [], exceptions: [half] },
      { days: [outside] },
    ]) {
      const result = await runVenueHours({ context, venueId: venue.id, ...pattern });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });

  it("follows the owner's feature: unknown owners are NOT_FOUND and members cannot write", async () => {
    const { context, venue } = await venueSetup();
    const missing = await runItemHours({ context, itemId: "nope", days: OFFICE_DAYS });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
    const member = peer({ of: context, access: "read" });
    const denied = await runVenueHours({ context: member, venueId: venue.id, days: OFFICE_DAYS });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    const read = await execute({
      operation: getVenueHours,
      input: { venueId: venue.id },
      context: member,
    });
    expect(read.ok).toBe(true);
  });

  it("warns on a line outside the item's hours, else its venue's, and never blocks it", async () => {
    const { context, venue } = await venueSetup();
    const room = await createBookableItem({ context });
    const item = await createTestItem({
      context,
      entityTypeId: room.entityTypeId,
      name: "Pier",
      venueId: venue.id,
    });
    // Sunday 1 November 2037, 09–11 UTC.
    const line = unwrap({
      result: await createHoldLine({ context, itemId: item.id, hold: "SOFT", from: 9, to: 11 }),
    });
    expect(await warningsOf({ context, lineId: line.id })).toEqual([]);
    unwrap({ result: await runVenueHours({ context, venueId: venue.id, days: OFFICE_DAYS }) });
    expect(await warningsOf({ context, lineId: line.id })).toEqual([
      { id: venue.id, kind: "OUTSIDE_VENUE_HOURS" },
    ]);
    unwrap({ result: await runItemHours({ context, itemId: item.id, days: ALL_DAYS }) });
    expect(await warningsOf({ context, lineId: line.id })).toEqual([]);
    const closed = [{ ...CHRISTMAS, date: "2037-11-01" }];
    unwrap({
      result: await runItemHours({ context, itemId: item.id, days: ALL_DAYS, exceptions: closed }),
    });
    expect(await warningsOf({ context, lineId: line.id })).toEqual([
      { id: item.id, kind: "OUTSIDE_ITEM_HOURS" },
    ]);
    const own = await execute({ operation: getItemHours, input: { itemId: item.id }, context });
    expect(unwrap({ result: own }).timeZone).toBe("Europe/London");
  });

  it("checks a line before it is saved by the same rule (line.checkHours)", async () => {
    const { context, venue } = await venueSetup();
    const room = await createBookableItem({ context });
    const item = await createTestItem({
      context,
      entityTypeId: room.entityTypeId,
      name: "Pier",
      venueId: venue.id,
    });
    // Sunday 1 November 2037, 09–11 UTC: the venue is open only on weekdays.
    const input = {
      itemId: item.id,
      startsAt: new Date("2037-11-01T09:00:00Z"),
      endsAt: new Date("2037-11-01T11:00:00Z"),
    };
    const check = async () =>
      unwrap({ result: await execute({ operation: checkLineHours, input, context }) });
    expect(await check()).toEqual({ kind: null, id: null });
    unwrap({ result: await runVenueHours({ context, venueId: venue.id, days: OFFICE_DAYS }) });
    expect(await check()).toEqual({ kind: "OUTSIDE_VENUE_HOURS", id: venue.id });
    unwrap({ result: await runItemHours({ context, itemId: item.id, days: ALL_DAYS }) });
    expect(await check()).toEqual({ kind: null, id: null });
    const backwards = { ...input, endsAt: input.startsAt };
    const refused = await execute({ operation: checkLineHours, input: backwards, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("leaves part and option lines out: they share their parent's time and warning", async () => {
    const { context, venue } = await venueSetup();
    const room = await createBookableItem({ context });
    const item = await createTestItem({
      context,
      entityTypeId: room.entityTypeId,
      name: "Pier",
      venueId: venue.id,
    });
    unwrap({ result: await runVenueHours({ context, venueId: venue.id, days: OFFICE_DAYS }) });
    // Sunday 1 November 2037, 09–11 UTC: closed.
    const line = {
      itemId: item.id,
      startsAt: new Date("2037-11-01T09:00:00Z"),
      endsAt: new Date("2037-11-01T11:00:00Z"),
    };
    const lines = [
      { ...line, id: "top", role: null },
      { ...line, id: "option", role: "OPTION" as const },
      { ...line, id: "part", role: "PART" as const },
      { ...line, id: "addOn", role: "ADD_ON" as const },
    ];
    const warnings = await loadHoursWarnings({ context, lines });
    expect([...warnings.keys()]).toEqual(["top", "addOn"]);
  });
});
