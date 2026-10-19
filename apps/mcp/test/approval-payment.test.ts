import {
  createMemoryPaymentProvider,
  setPaymentProvider,
  setStripeConnectGateway,
} from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";
import { seedTicket } from "./seed-ticket";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

/** A ticket at an organization with an active payment account, and the user's AI assistant. */
async function setup() {
  const userId = `user_${createId()}`;
  const base = testContext({ actor: { type: "user", userId } });
  const ai = testContext({
    organizationId: base.organizationId,
    actor: { type: "ai", userId, conversationId: "conv_pay" },
  });
  const user = await connect({ context: base });
  const { id: ticketId, customerId } = await seedTicket({ client: user });
  const email = { id: customerId, email: "billing@example.com" };
  await call({ client: user, name: "customer_update", args: email });
  installFakeStripe({ status: "ACTIVE" });
  await call({ client: user, name: "paymentAccount_startOnboarding" });
  await call({ client: user, name: "paymentAccount_sync" });
  const provider = createMemoryPaymentProvider();
  setPaymentProvider({ provider });
  return { base, user, assistant: await connect({ context: ai }), ticketId, provider };
}

describe("approval flow: payments (ADR 0058)", () => {
  it("never calls the payment provider for a proposal, only after approval", async () => {
    const { base, user, assistant, ticketId, provider } = await setup();
    for (const method of ["INVOICE", "CARD"]) {
      const proposal = await call({
        client: assistant,
        name: "payment_create",
        args: { ticketId, method, amountMinor: 50_000 },
      });
      expect(proposal.data.status, JSON.stringify(proposal.data)).toBe("approval_required");
    }
    expect(provider.charges).toEqual([]);
    expect(await base.db.payment.count()).toBe(0);

    const proposal = await call({
      client: assistant,
      name: "payment_create",
      args: { ticketId, method: "INVOICE", amountMinor: 50_000 },
    });
    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.isError, JSON.stringify(confirmed.data)).toBe(false);
    expect(provider.charges).toHaveLength(1);
    expect(provider.charges[0]).toMatchObject({
      kind: "invoice",
      idempotencyKey: `okazi-payment-${confirmed.data.id}`,
    });
    expect(confirmed.data.providerReference).toMatch(/^in_test_/);
  });
});
