import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: change sets (ADR 0049)", () => {
  it("refuses another organization's ids in a step and saves none of the set", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const venueA = await call({ client: a, name: "venue_create", args: { name: "A's hall" } });
    expect(venueA.isError, JSON.stringify(venueA.data)).toBe(false);
    const steps = [
      { operation: "venue.create", input: { name: "B's hall" } },
      { operation: "venue.update", input: { id: venueA.data.id, name: "Taken over" } },
    ];
    const applied = await call({
      client: b,
      name: "changeSet_apply",
      args: { title: "Take over", steps },
    });
    expect(applied.data.code, JSON.stringify(applied.data)).toBe("NOT_FOUND");
    const listB = await call({ client: b, name: "venue_list", args: {} });
    expect(listB.data.items).toEqual([]);
    const got = await call({ client: a, name: "venue_get", args: { id: venueA.data.id } });
    expect(got.data.name).toBe("A's hall");
  });
});
