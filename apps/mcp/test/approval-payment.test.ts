import { applyProviderDelivery, type ExecuteContext, resetProviderAdapters } from "@bibi/core";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";
import { connectLedger } from "./ledger";
import { seedOrder } from "./seed-order";

afterEach(() => {
  resetProviderAdapters();
});

/** An order at an organization with an active payment account, and the user's AI assistant. */
async function setup() {
  const userId = `user_${createId()}`;
  const base = testContext({ actor: { type: "user", userId } });
  const ai = testContext({
    organizationId: base.organizationId,
    actor: { type: "ai", userId, conversationId: "conv_pay" },
  });
  const user = await connect({ context: base });
  await connectLedger({ context: base });
  const { id: orderId, customerId } = await seedOrder({ client: user });
  const email = { id: customerId, email: "billing@example.com" };
  await call({ client: user, name: "customer_update", args: email });
  const provider = installFakeStripe({ status: "ACTIVE" });
  await call({ client: user, name: "paymentAccount_startOnboarding" });
  await call({ client: user, name: "paymentAccount_sync" });

  const args = { orderId, description: "Advance", amountMinor: 100_000 };
  const draft = await call({ client: user, name: "deposit_create", args });
  await call({ client: user, name: "deposit_send", args: { id: draft.data.id } });
  const depositId: string = draft.data.id;
  return { base, user, assistant: await connect({ context: ai }), depositId, provider };
}

/** The provider's webhook reporting the card checkout paid (ADR 0100). */
async function settle({ context, reference }: { context: ExecuteContext; reference: string }) {
  const connection = await context.db.providerConnection.findFirstOrThrow({});
  const eventId = `evt_${createId()}`;
  const signal = {
    provider: connection.provider,
    eventId,
    externalAccountId: connection.externalAccountId,
    occurredAt: new Date(),
    kind: "attempt.succeeded" as const,
    reference,
  };
  const delivery = { eventId, type: signal.kind, signals: [signal] };
  const applied = await applyProviderDelivery({ provider: connection.provider, delivery });
  expect(applied.ok && applied.value.status, JSON.stringify(applied)).toBe("applied");
}

describe("approval flow: payments (ADR 0058)", () => {
  it("never calls the payment provider for a proposal, only after approval", async () => {
    const { base, user, assistant, depositId, provider } = await setup();
    for (const amountMinor of [50_000, 40_000]) {
      const proposal = await call({
        client: assistant,
        name: "payment_create",
        args: { depositId, method: "CARD", amountMinor },
      });
      expect(proposal.data.status, JSON.stringify(proposal.data)).toBe("approval_required");
    }
    expect(provider.charges).toEqual([]);
    expect(await base.db.payment.count()).toBe(0);

    const proposal = await call({
      client: assistant,
      name: "payment_create",
      args: { depositId, method: "CARD", amountMinor: 50_000 },
    });
    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.isError, JSON.stringify(confirmed.data)).toBe(false);
    expect(provider.charges).toHaveLength(1);
    expect(provider.charges[0]).toMatchObject({
      kind: "checkout",
      idempotencyKey: `bibi-payment-${confirmed.data.id}`,
    });
    expect(confirmed.data.providerReference).toMatch(/^cs_test_/);
  });

  it("proposes cancels, manual payments and refunds without touching the provider", async () => {
    const { base, user, assistant, depositId, provider } = await setup();
    const args = { depositId, method: "CARD", amountMinor: 50_000 };
    const payment = await call({ client: user, name: "payment_create", args });
    expect(payment.isError, JSON.stringify(payment.data)).toBe(false);
    const { id } = payment.data;
    const propose = async ({ name, args: toolArgs }: { name: string; args: object }) => {
      const proposal = await call({ client: assistant, name, args: { ...toolArgs } });
      expect(proposal.data.status, `${name} ${JSON.stringify(proposal.data)}`).toBe(
        "approval_required",
      );
    };
    await propose({ name: "payment_cancel", args: { id } });
    await settle({ context: base, reference: payment.data.providerReference });
    await propose({ name: "payment_refund", args: { id, amountMinor: 10_000 } });
    const manual = { depositId, amountMinor: 10_000, paidAt: "2026-05-01T10:00:00Z" };
    await propose({ name: "payment_recordManual", args: manual });
    expect(provider.portCalls).toEqual([]);
    expect(await base.db.paymentRefund.count()).toBe(0);
    expect(await base.db.payment.count()).toBe(1);
  });
});
