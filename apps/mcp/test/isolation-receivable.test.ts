import {
  createMemoryPaymentProvider,
  setPaymentProvider,
  setStripeConnectGateway,
} from "@bibi/core";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";
import { seedTicket } from "./seed-ticket";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
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
    const ticket = await seedTicket({ client: a });
    installFakeStripe({ status: "ACTIVE" });
    setPaymentProvider({ provider: createMemoryPaymentProvider() });
    const args = { ticketId: ticket.id, description: "Advance", amountMinor: 100_000 };
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
        ["invoice_void", { id }],
        ["invoice_create", { ticketId: ticket.id }],
        ["payment_balance", { ticketId: ticket.id }],
      ],
    });
    const deposits = await call({ client: b, name: "deposit_list", args: { ticketId: ticket.id } });
    expect(deposits.data.items).toEqual([]);
    const invoices = await call({ client: b, name: "invoice_list", args: { ticketId: ticket.id } });
    expect(invoices.data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: {
        query: "query($id: String!) { deposits(ticketId: $id) { items { id } } }",
        variables: { id: ticket.id },
      },
    });
    expect(graph.data.data.deposits.items).toEqual([]);
    const own = await call({ client: a, name: "deposit_get", args: { id } });
    expect(own.data).toMatchObject({ id, status: "DRAFT", progress: "OPEN" });
  });
});
