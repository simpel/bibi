import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

const range = { from: "2026-11-01", to: "2026-11-07" };

describe("cross-organization isolation: calendar", () => {
  it("hides one organization's blocks and refuses its venue and ticket", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { ticketId, itemId } = await seedProgram({ client: a });
    const venue = await call({ client: a, name: "venue_create", args: { name: "A's hall" } });
    expect(venue.isError, JSON.stringify(venue.data)).toBe(false);

    const own = await call({ client: a, name: "calendar_range", args: range });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect(own.data.blocks.some((block: { itemId: string }) => block.itemId === itemId)).toBe(true);

    for (const filter of [{ venueId: venue.data.id }, { ticketId }]) {
      const result = await call({
        client: b,
        name: "calendar_range",
        args: { ...range, ...filter },
      });
      expect(result.data.code, JSON.stringify(filter)).toBe("NOT_FOUND");
    }
    const open = await call({ client: b, name: "calendar_range", args: range });
    expect(open.isError, JSON.stringify(open.data)).toBe(false);
    expect(open.data.blocks).toEqual([]);
  });
});
