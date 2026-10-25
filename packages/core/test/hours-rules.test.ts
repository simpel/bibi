import { describe, expect, it } from "vitest";
import { createVenue, execute, getVenueHours, PRESET_PERMISSIONS } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { createHoldLine } from "./hold-helpers";
import { OFFICE_DAYS, runItemHours, runVenueHours, warningsOf } from "./hours-helpers";
import { createTestItem } from "./item-helpers";
import { createBookableItem } from "./occupancy-helpers";
import { ticketSetup } from "./ticket-helpers";

/** A venue with an item and a soft line on Sunday 1 November 2026, 09–11 UTC. */
async function lineSetup() {
  const setup = await ticketSetup();
  const { context } = setup;
  const input = { name: "Quay", timeZone: "Europe/Stockholm" };
  const venue = unwrap({ result: await execute({ operation: createVenue, input, context }) });
  const room = await createBookableItem({ context });
  const item = await createTestItem({
    context,
    entityTypeId: room.entityTypeId,
    name: "Deck",
    venueId: venue.id,
  });
  const line = unwrap({
    result: await createHoldLine({ context, itemId: item.id, hold: "SOFT", from: 9, to: 11 }),
  });
  return { ...setup, venue, item, line };
}

describe("hours rules (ADR 0064, 0050)", () => {
  it("runs concurrent replaces one after the other instead of merging them", async () => {
    const { context, venue } = await lineSetup();
    const [a, b] = [OFFICE_DAYS.slice(0, 2), OFFICE_DAYS.slice(2, 4)];
    const results = await Promise.all([
      runVenueHours({ context, venueId: venue.id, days: a }),
      runVenueHours({ context, venueId: venue.id, days: b }),
    ]);
    expect(results.every((result) => result.ok)).toBe(true);
    const read = unwrap({
      result: await execute({ operation: getVenueHours, input: { venueId: venue.id }, context }),
    });
    expect([a, b]).toContainEqual(read.days);
  });

  it("hides the venue fallback warning from a caller without venue:read", async () => {
    const { context, venue, line } = await lineSetup();
    unwrap({ result: await runVenueHours({ context, venueId: venue.id, days: OFFICE_DAYS }) });
    const { venue: _venue, ...rest } = PRESET_PERMISSIONS.admin;
    const noVenue = testContext({ organizationId: context.organizationId, permissions: rest });
    expect(await warningsOf({ context: noVenue, lineId: line.id })).toEqual([]);
    expect(await warningsOf({ context, lineId: line.id })).toHaveLength(1);
  });

  it("treats exceptions alone as a pattern: every other day is closed", async () => {
    const { context, item, line } = await lineSetup();
    const open = { startMinute: 0, endMinute: 1440, breakStartMinute: null, breakEndMinute: null };
    const later = [{ date: "2027-06-01", ...open, note: "Season opening" }];
    unwrap({
      result: await runItemHours({ context, itemId: item.id, days: [], exceptions: later }),
    });
    expect(await warningsOf({ context, lineId: line.id })).toEqual([
      { id: item.id, kind: "OUTSIDE_ITEM_HOURS" },
    ]);
    const today = [{ date: "2026-11-01", ...open, note: null }];
    unwrap({
      result: await runItemHours({ context, itemId: item.id, days: [], exceptions: today }),
    });
    expect(await warningsOf({ context, lineId: line.id })).toEqual([]);
  });
});
