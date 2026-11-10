import { resetProviderAdapters } from "@bibi/core";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";
import { seedOrder } from "./seed-order";
import { seedQuoteBasis } from "./seed-quote-basis";

afterEach(() => {
  resetProviderAdapters();
});

type Client = Awaited<ReturnType<typeof connect>>;

/** Every listed tool, called by organization B with A's id, is NOT_FOUND. */
async function expectNotFound({
  client,
  calls,
}: {
  client: Client;
  calls: [string, Record<string, unknown>][];
}) {
  for (const [name, args] of calls) {
    const result = await call({ client, name, args });
    expect(result.data.code, `${name} ${JSON.stringify(result.data)}`).toBe("NOT_FOUND");
  }
}

describe("cross-organization isolation: receivables and balances (ADR 0057)", () => {
  it("hides one organization's deposits, invoices and balance from another", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const order = await seedOrder({ client: a });
    installFakeStripe({ status: "ACTIVE" });
    const args = { orderId: order.id, description: "Advance", amountMinor: 100_000 };
    const deposit = await call({ client: a, name: "deposit_create", args });
    expect(deposit.isError, JSON.stringify(deposit.data)).toBe(false);
    const { id } = deposit.data;
    await expectNotFound({
      client: b,
      calls: [
        ["deposit_get", { id }],
        ["deposit_send", { id }],
        ["deposit_void", { id }],
        ["deposit_create", args],
        ["invoice_get", { id }],
        ["invoice_send", { id }],
        ["invoice_sync", { id }],
        ["invoice_void", { id }],
        ["invoice_create", { orderId: order.id }],
        ["payment_balance", { orderId: order.id }],
      ],
    });
    const deposits = await call({ client: b, name: "deposit_list", args: { orderId: order.id } });
    expect(deposits.data.items).toEqual([]);
    const invoices = await call({ client: b, name: "invoice_list", args: { orderId: order.id } });
    expect(invoices.data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: {
        query: "query($id: String!) { deposits(orderId: $id) { items { id } } }",
        variables: { id: order.id },
      },
    });
    expect(graph.data.data.deposits.items).toEqual([]);
    const own = await call({ client: a, name: "deposit_get", args: { id } });
    expect(own.data).toMatchObject({ id, status: "DRAFT", progress: "OPEN" });
  });

  it("refuses to credit another organization's sent invoice", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { orderId } = await seedQuoteBasis({ client: a });
    const order = await call({ client: a, name: "order_get", args: { id: orderId } });
    const status = { id: order.data.statusId, invoiceable: true };
    await call({ client: a, name: "orderStatus_update", args: status });
    const invoice = await call({ client: a, name: "invoice_create", args: { orderId } });
    expect(invoice.isError, JSON.stringify(invoice.data)).toBe(false);
    const invoiceId: string = invoice.data.id;
    await call({ client: a, name: "invoice_send", args: { id: invoiceId } });
    await expectNotFound({ client: b, calls: [["invoice_credit", { invoiceId }]] });
    const own = await call({ client: a, name: "invoice_get", args: { id: invoiceId } });
    expect(own.data).toMatchObject({ status: "SENT", creditNotes: [] });
    const args = { invoiceId, amountMinor: 10_000 };
    const credited = await call({ client: a, name: "invoice_credit", args });
    expect(credited.isError, JSON.stringify(credited.data)).toBe(false);
    const noteId: string = credited.data.creditNotes[0].id;
    await expectNotFound({ client: b, calls: [["creditNote_get", { id: noteId }]] });
    const byInvoice = await call({ client: b, name: "creditNote_list", args: { invoiceId } });
    expect(byInvoice.data.items).toEqual([]);
    const byOrder = await call({ client: b, name: "creditNote_list", args: { orderId } });
    expect(byOrder.data.items).toEqual([]);
    const mine = await call({ client: a, name: "creditNote_list", args: { orderId } });
    expect(mine.data.items.map((note: { id: string }) => note.id)).toEqual([noteId]);
  });
});
