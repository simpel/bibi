import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTicket } from "./seed-ticket";

function openTickets({ data }: { data: { statuses: { tickets: number }[] } }): number {
  return data.statuses.reduce((sum, status) => sum + status.tickets, 0);
}

describe("cross-organization isolation: dashboard", () => {
  it("never counts one organization's tickets in another's summary", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await seedTicket({ client: a });

    const own = await call({ client: a, name: "dashboard_summary", args: {} });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect(openTickets(own)).toBe(1);

    const theirs = await call({ client: b, name: "dashboard_summary", args: {} });
    expect(theirs.isError, JSON.stringify(theirs.data)).toBe(false);
    expect(openTickets(theirs)).toBe(0);
    expect(theirs.data.comingUp).toEqual([]);
    expect(theirs.data.attention.expiringHolds).toEqual([]);
    expect(theirs.data.attention.unsentSheets).toEqual([]);
    expect(theirs.data.attention.overdue).toEqual({ invoices: 0, totalMinor: 0 });
    for (const row of theirs.data.utilisation ?? []) expect(row.bookedMinutes).toBe(0);
  });
});
