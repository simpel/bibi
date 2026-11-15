import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrder } from "./seed-order";

/** Today and the next six days in UTC, the widest period most callers ask for. */
function thisWeek() {
  const today = new Date();
  const last = new Date(today.getTime() + 6 * 86_400_000);
  return { from: today.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}

describe("cross-organization isolation: my work", () => {
  it("never shows one organization's work to the same person in another", async () => {
    const actor = { type: "user" as const, userId: `user_isolation_${Date.now()}` };
    const a = await connect({ context: testContext({ actor }) });
    const b = await connect({ context: testContext({ actor }) });
    await seedOrder({ client: a });

    const own = await call({ client: a, name: "myWork_view", args: thisWeek() });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);

    const theirs = await call({ client: b, name: "myWork_view", args: thisWeek() });
    expect(theirs.isError, JSON.stringify(theirs.data)).toBe(false);
    expect(theirs.data.rows).toEqual([]);
    expect(theirs.data.todo).toEqual({
      runSheets: [],
      expiringHolds: [],
      quotes: [],
      messages: [],
      totals: { runSheets: 0, expiringHolds: 0, quotes: 0, messages: 0 },
    });
    expect(theirs.data.rowsTotal).toBe(0);
    expect(theirs.data.unreadNotifications).toBe(0);
    expect(theirs.data.notifications).toEqual([]);
  });
});
