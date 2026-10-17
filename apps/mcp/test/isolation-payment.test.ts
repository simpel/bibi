import {
  createMemoryPaymentProvider,
  setPaymentProvider,
  setStripeConnectGateway,
} from "@okazi/core";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";
import { seedBooking } from "./seed-booking";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

describe("cross-organization isolation: payments", () => {
  it("hides one organization's payments from another and refuses to charge its booking", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { id: bookingId } = await seedBooking({ client: a });
    installFakeStripe({ status: "ACTIVE" });
    setPaymentProvider({ provider: createMemoryPaymentProvider() });
    await call({ client: a, name: "paymentAccount_startOnboarding" });
    await call({ client: a, name: "paymentAccount_sync" });
    const args = { bookingId, method: "CARD", amountMinor: 50_000 };
    const payment = await call({ client: a, name: "payment_create", args });
    expect(payment.isError, JSON.stringify(payment.data)).toBe(false);

    const get = await call({ client: b, name: "payment_get", args: { id: payment.data.id } });
    expect(get.data.code).toBe("NOT_FOUND");
    const listed = await call({ client: b, name: "payment_list", args: { bookingId } });
    expect(listed.data.items).toEqual([]);
    const created = await call({ client: b, name: "payment_create", args });
    expect(created.data.code).toBe("NOT_FOUND");
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: {
        query: "query($id: String!) { payments(bookingId: $id) { items { id } } }",
        variables: { id: bookingId },
      },
    });
    expect(graph.data.data.payments.items).toEqual([]);
    const own = await call({ client: a, name: "payment_list", args: { bookingId } });
    expect(own.data.items).toHaveLength(1);
  });
});
