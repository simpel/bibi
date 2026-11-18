import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrder } from "./seed-order";

describe("cross-organization isolation: card cues", () => {
  it("returns no cues for another organization's orders", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const order = await seedOrder({ client: a });

    const own = await call({ client: a, name: "pipeline_cues", args: { orderIds: [order.id] } });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect(own.data.cues.map((cue: { orderId: string }) => cue.orderId)).toEqual([order.id]);

    const theirs = await call({ client: b, name: "pipeline_cues", args: { orderIds: [order.id] } });
    expect(theirs.isError, JSON.stringify(theirs.data)).toBe(false);
    expect(theirs.data.cues).toEqual([]);
  });
});
