import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrder } from "./seed-order";
import { thisMonth } from "./this-month";

function openOrders({ data }: { data: { statuses: { orders: number }[] } }): number {
  return data.statuses.reduce((sum, status) => sum + status.orders, 0);
}

describe("cross-organization isolation: dashboard", () => {
  it("never counts one organization's orders in another's summary", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await seedOrder({ client: a });

    const own = await call({ client: a, name: "dashboard_summary", args: thisMonth() });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect(openOrders(own)).toBe(1);

    const theirs = await call({ client: b, name: "dashboard_summary", args: thisMonth() });
    expect(theirs.isError, JSON.stringify(theirs.data)).toBe(false);
    expect(openOrders(theirs)).toBe(0);
    expect(theirs.data.scheduled).toEqual([]);
    expect(theirs.data.attention.expiringHolds).toEqual([]);
    expect(theirs.data.attention.unsentRunSheets).toEqual([]);
    expect(theirs.data.attention.overdue).toEqual({ invoices: 0, totalMinor: 0 });
    for (const row of theirs.data.utilisation ?? []) expect(row.bookedMinutes).toBe(0);
  });
});
