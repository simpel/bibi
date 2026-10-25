import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const DAYS = [
  { weekday: 0, startMinute: 540, endMinute: 1020, breakStartMinute: null, breakEndMinute: null },
];
const HOURS = { days: DAYS, exceptions: [] };
const TOOLS = {
  venue: { get: "venueHours_get", set: "venueHours_set" },
  item: { get: "itemHours_get", set: "itemHours_set" },
} as const;

describe("cross-organization isolation: shared hours", () => {
  it("refuses another organization's venue and item hours and leaves them unchanged", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const venue = await call({ client: a, name: "venue_create", args: { name: "A's hall" } });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Boat" },
    });
    const item = await call({
      client: a,
      name: "item_create",
      args: { entityTypeId: type.data.id, name: "Secret boat" },
    });
    expect(item.isError, JSON.stringify(item.data)).toBe(false);
    const owners = [
      { owner: "venue" as const, args: { venueId: venue.data.id } },
      { owner: "item" as const, args: { itemId: item.data.id } },
    ];
    for (const { owner, args } of owners) {
      const set = await call({ client: a, name: TOOLS[owner].set, args: { ...args, ...HOURS } });
      expect(set.isError, JSON.stringify(set.data)).toBe(false);
    }
    for (const { owner, args } of owners) {
      const read = await call({ client: b, name: TOOLS[owner].get, args });
      expect(read.data.code, `${owner} get`).toBe("NOT_FOUND");
      const write = await call({
        client: b,
        name: TOOLS[owner].set,
        args: { ...args, days: [], exceptions: [] },
      });
      expect(write.data.code, `${owner} set`).toBe("NOT_FOUND");
      const own = await call({ client: a, name: TOOLS[owner].get, args });
      expect(own.data.days, `${owner} unchanged`).toEqual(DAYS);
    }
  });
});
