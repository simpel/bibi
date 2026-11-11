import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: item summary", () => {
  it("refuses another organization's venue", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const venue = await call({ client: a, name: "venue_create", args: { name: "Secret venue" } });
    expect(venue.isError, JSON.stringify(venue.data)).toBe(false);
    const foreign = await call({
      client: b,
      name: "item_summary",
      args: { venueId: venue.data.id },
    });
    expect(foreign.data.code).toBe("NOT_FOUND");
    const own = await call({ client: a, name: "item_summary", args: { venueId: venue.data.id } });
    expect(own.data).toEqual({ total: 0, types: [] });
  });
});
