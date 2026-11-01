import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTicket } from "./seed-ticket";

const period = { from: "2026-01-01", to: "2026-12-31" };

function openTickets({ data }: { data: { statuses: { tickets: number }[] } }): number {
  return data.statuses.reduce((sum, status) => sum + status.tickets, 0);
}

describe("cross-organization isolation: dashboard", () => {
  it("never counts one organization's tickets in another's summary", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await seedTicket({ client: a });

    const own = await call({ client: a, name: "dashboard_summary", args: period });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect(openTickets(own)).toBe(1);

    const theirs = await call({ client: b, name: "dashboard_summary", args: period });
    expect(theirs.isError, JSON.stringify(theirs.data)).toBe(false);
    expect(openTickets(theirs)).toBe(0);
    for (const row of theirs.data.outcomes ?? []) {
      expect([row.wonTickets, row.lostTickets]).toEqual([0, 0]);
    }
    for (const row of theirs.data.utilisation ?? []) expect(row.bookedMinutes).toBe(0);
  });
});
