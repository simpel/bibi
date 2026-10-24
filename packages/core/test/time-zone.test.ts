import { describe, expect, it } from "vitest";
import {
  createOccupancy,
  createVenue,
  effectiveTimeZone,
  execute,
  FALLBACK_TIME_ZONE,
  getOccupancy,
  getOrganizationProfile,
  getVenue,
  TimeZoneSchema,
  updateOrganizationProfile,
  updateVenue,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";
import { hours } from "./occupancy-helpers";

describe("time zones (ADR 0064)", () => {
  it("accepts IANA names the runtime knows and refuses offsets and unknown names", () => {
    for (const zone of ["Europe/Stockholm", "America/Argentina/Buenos_Aires", "UTC"]) {
      expect(TimeZoneSchema.safeParse(zone).success).toBe(true);
    }
    for (const zone of ["+01:00", "Europe/Atlantis", "", "Europe Stockholm"]) {
      expect(TimeZoneSchema.safeParse(zone).success).toBe(false);
    }
  });

  it("resolves the venue's zone, else the organization's, else the fallback", () => {
    const organization = { timeZone: "Europe/Helsinki" };
    expect(effectiveTimeZone({ venue: { timeZone: "Europe/Oslo" }, organization })).toBe(
      "Europe/Oslo",
    );
    expect(effectiveTimeZone({ venue: { timeZone: null }, organization })).toBe("Europe/Helsinki");
    expect(effectiveTimeZone({ organization })).toBe("Europe/Helsinki");
    expect(effectiveTimeZone({})).toBe(FALLBACK_TIME_ZONE);
  });

  it("stores the organization's zone and refuses an unknown one", async () => {
    const context = testContext();
    const before = unwrap({
      result: await execute({ operation: getOrganizationProfile, input: {}, context }),
    });
    expect(before.timeZone).toBe(FALLBACK_TIME_ZONE);
    const input = { timeZone: "Europe/Helsinki" };
    unwrap({ result: await execute({ operation: updateOrganizationProfile, input, context }) });
    const after = unwrap({
      result: await execute({ operation: getOrganizationProfile, input: {}, context }),
    });
    expect(after.timeZone).toBe("Europe/Helsinki");
    const bad = { timeZone: "Mars/Olympus" };
    const refused = await execute({ operation: updateOrganizationProfile, input: bad, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("lets a venue override and inherit the zone without moving a stored time", async () => {
    const context = testContext();
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "Kajen" }, context }),
    });
    expect(venue.timeZone).toBeNull();
    const type = await createRoomType({ context });
    const item = await createTestItem({
      context,
      entityTypeId: type.id,
      name: "Älvsalen",
      venueId: venue.id,
    });
    const block = { itemId: item.id, type: "MAINTENANCE" as const, ...hours({ from: 8, to: 12 }) };
    const created = unwrap({
      result: await execute({ operation: createOccupancy, input: block, context }),
    });
    const override = { id: venue.id, timeZone: "America/New_York" };
    unwrap({ result: await execute({ operation: updateVenue, input: override, context }) });
    const read = unwrap({
      result: await execute({ operation: getVenue, input: { id: venue.id }, context }),
    });
    expect(read.timeZone).toBe("America/New_York");
    const occupancy = unwrap({
      result: await execute({ operation: getOccupancy, input: { id: created.id }, context }),
    });
    expect(occupancy.startsAt).toEqual(block.startsAt);
    const inherit = { id: venue.id, timeZone: null };
    const cleared = unwrap({
      result: await execute({ operation: updateVenue, input: inherit, context }),
    });
    expect(cleared.timeZone).toBeNull();
    const bad = { id: venue.id, timeZone: "+02:00" };
    const refused = await execute({ operation: updateVenue, input: bad, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });
});
