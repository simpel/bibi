import { resetProviderAdapters } from "@bibi/core";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";
import { seedOrder } from "./seed-order";

afterEach(() => {
  resetProviderAdapters();
});

describe("cross-organization isolation: payments", () => {
  it("hides one organization's payments from another and refuses to charge its order", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { id: orderId } = await seedOrder({ client: a });
    installFakeStripe({ status: "ACTIVE" });
    await call({ client: a, name: "paymentAccount_startOnboarding" });
    await call({ client: a, name: "paymentAccount_sync" });
    const depositArgs = { orderId, description: "Advance", amountMinor: 100_000 };
    const draft = await call({ client: a, name: "deposit_create", args: depositArgs });
    await call({ client: a, name: "deposit_send", args: { id: draft.data.id } });
    const args = { depositId: draft.data.id, method: "CARD", amountMinor: 50_000 };
    const payment = await call({ client: a, name: "payment_create", args });
    expect(payment.isError, JSON.stringify(payment.data)).toBe(false);

    const get = await call({ client: b, name: "payment_get", args: { id: payment.data.id } });
    expect(get.data.code).toBe("NOT_FOUND");
    const listed = await call({ client: b, name: "payment_list", args: { orderId } });
    expect(listed.data.items).toEqual([]);
    const created = await call({ client: b, name: "payment_create", args });
    expect(created.data.code).toBe("NOT_FOUND");
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: {
        query: "query($id: String!) { payments(orderId: $id) { items { id } } }",
        variables: { id: orderId },
      },
    });
    expect(graph.data.data.payments.items).toEqual([]);
    const suggest = await call({ client: b, name: "deposit_suggest", args: { orderId } });
    expect(suggest.data.code).toBe("NOT_FOUND");
    const request = await call({
      client: b,
      name: "deposit_request",
      args: { orderId, description: "Advance", amountMinor: 100_000 },
    });
    expect(request.data.code).toBe("NOT_FOUND");
    const own = await call({ client: a, name: "payment_list", args: { orderId } });
    expect(own.data.items).toHaveLength(1);
  });
});

describe("cross-organization isolation: payment settings", () => {
  it("keeps one organization's deposit rule out of another's settings", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const saved = await call({
      client: a,
      name: "paymentSettings_update",
      args: { depositPercent: 40, invoiceProvider: "FORTNOX" },
    });
    expect(saved.isError, JSON.stringify(saved.data)).toBe(false);
    const read = await call({ client: b, name: "paymentSettings_get", args: {} });
    expect(read.data).toMatchObject({
      id: null,
      depositPercent: null,
      depositMinimumMinor: null,
      invoiceProvider: null,
    });
    const own = await call({ client: a, name: "paymentSettings_get", args: {} });
    expect(own.data).toMatchObject({ depositPercent: 40, invoiceProvider: "FORTNOX" });
  });
});
