import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
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
    const args = { ticketId: secret.ticketId, validUntil: "2099-12-01T00:00:00.000Z" };
    const quote = await call({ client: a, name: "quote_create", args });
    for (const name of ["quote_send", "quote_accept"]) {
      const moved = await call({ client: a, name, args: { id: quote.data.id } });
      expect(moved.isError, JSON.stringify(moved.data)).toBe(false);
    }

    const own = await call({ client: a, name: "dashboard_summary", args: thisMonth() });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect(own.data.bookedAhead).toEqual([expect.objectContaining({ tickets: 1 })]);

    const ahead = await call({ client: b, name: "dashboard_summary", args: thisMonth() });
    expect(ahead.data.bookedAhead).toEqual([]);
    const theirs = await call({ client: b, name: "finance_overview", args: period });
    expect(theirs.isError, JSON.stringify(theirs.data)).toBe(false);
    expect([theirs.data.invoicedExclVatMinor, theirs.data.outstandingMinor]).toEqual([0, 0]);
    for (const row of theirs.data.outcomes ?? []) {
      expect([row.wonTickets, row.lostTickets]).toEqual([0, 0]);
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

  it("never shows or hands over one organization's SIE exports to another", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const id = await exportOf({ client: a });
    for (const name of ["accountingExport_get", "accountingExport_download"]) {
      const result = await call({ client: b, name, args: { id } });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const theirs = await call({ client: b, name: "accountingExport_preview", args: RANGE });
    expect(theirs.data.voucherCount).toBe(0);
    const made = await call({ client: b, name: "accountingExport_create", args: RANGE });
    expect(made.data.code).toBe("CONFLICT");
    const list = await call({ client: b, name: "accountingExport_list", args: {} });
    expect(list.data.items).toEqual([]);
  });
});

/** A range around now: yesterday to tomorrow, so anything made in the test is inside it. */
const DAY = 86_400_000;
const isoDay = ({ offset }: { offset: number }) =>
  new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
const RANGE = { from: isoDay({ offset: -1 }), to: isoDay({ offset: 1 }) };

/** Organization A invoices its quote basis and exports it; returns the export's id. */
async function exportOf({ client }: { client: Client }): Promise<string> {
  const profile = { orgNumber: "556000-0000", legalName: "A AB" };
  await call({ client, name: "organizationProfile_update", args: profile });
  const secret = await seedQuoteBasis({ client });
  const ticket = await call({ client, name: "ticket_get", args: { id: secret.ticketId } });
  const status = { id: ticket.data.statusId, invoiceable: true };
  await call({ client, name: "ticketStatus_update", args: status });
  const invoice = await call({
    client,
    name: "invoice_create",
    args: { ticketId: secret.ticketId },
  });
  await call({ client, name: "invoice_send", args: { id: invoice.data.id } });
  const made = await call({ client, name: "accountingExport_create", args: RANGE });
  expect(made.isError, JSON.stringify(made.data)).toBe(false);
  return made.data.id as string;
}
