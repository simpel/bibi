import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedQuoteBasis } from "./seed-quote-basis";
import { thisMonth } from "./this-month";

const period = { from: "2026-01-01", to: "2026-12-31" };

describe("cross-organization isolation: financials", () => {
  it("never counts one organization's money in another's overview or dashboard", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedQuoteBasis({ client: a });
    const args = { orderId: secret.orderId, validUntil: "2099-12-01T00:00:00.000Z" };
    const quote = await call({ client: a, name: "quote_create", args });
    for (const name of ["quote_send", "quote_accept"]) {
      const moved = await call({ client: a, name, args: { id: quote.data.id } });
      expect(moved.isError, JSON.stringify(moved.data)).toBe(false);
    }

    const own = await call({ client: a, name: "dashboard_summary", args: thisMonth() });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect(own.data.bookedAhead).toEqual([expect.objectContaining({ orders: 1 })]);

    const ahead = await call({ client: b, name: "dashboard_summary", args: thisMonth() });
    expect(ahead.data.bookedAhead).toEqual([]);
    const theirs = await call({ client: b, name: "finance_overview", args: period });
    expect(theirs.isError, JSON.stringify(theirs.data)).toBe(false);
    expect([theirs.data.invoicedExclVatMinor, theirs.data.outstandingMinor]).toEqual([0, 0]);
    for (const row of theirs.data.outcomes ?? []) {
      expect([row.wonOrders, row.lostOrders]).toEqual([0, 0]);
    }
  });

  it("refuses another organization's item types and items as revenue account targets", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedQuoteBasis({ client: a });
    const mapped = [{ entityTypeId: null, itemId: secret.itemId, account: "3041" }];
    const own = await call({
      client: a,
      name: "accountingSettings_update",
      args: { revenueAccounts: mapped },
    });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    const stolen = await call({
      client: b,
      name: "accountingSettings_update",
      args: { revenueAccounts: mapped },
    });
    expect(stolen.data.code).toBe("VALIDATION");
    const read = await call({ client: b, name: "accountingSettings_get", args: {} });
    expect(read.data).toMatchObject({ id: null, revenueAccount: "3001", revenueAccounts: [] });
  });
});
