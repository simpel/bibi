import { type CapturedLogs, captureLogs } from "@bibi/logger";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setPaymentProvider, setStripeConnectGateway } from "../src/index";
import { paidEvent, pendingPayment, postEvent, stripeEvent } from "./stripe-webhook-helpers";

let logs: CapturedLogs;
beforeEach(() => {
  logs = captureLogs();
});
afterEach(() => {
  logs.restore();
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

describe("Stripe webhook", () => {
  it("rejects an event with a bad signature", async () => {
    const { account, payment } = await pendingPayment({ coordinated: true });
    const event = paidEvent({ account, reference: payment.providerReference });
    const bad = await postEvent({ event, header: "t=1,v1=abc" });
    const missing = await postEvent({ event, header: null });
    expect([bad.status, missing.status]).toEqual([401, 401]);
  });

  it("marks the payment paid and never moves the ticket's status", async () => {
    const { context, account, payment, ticketId } = await pendingPayment({ coordinated: true });
    const posted = await postEvent({
      event: paidEvent({ account, reference: payment.providerReference }),
    });
    expect(posted).toEqual({ status: 200, body: { status: "applied" } });
    const row = await context.db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(row.status).toBe("SUCCEEDED");
    expect(row.paidAt).toBeInstanceOf(Date);
    const ticket = await context.db.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: { ticketStatus: true },
    });
    expect(ticket.ticketStatus.entry).toBe(true);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "payment.applySignal" },
    });
    expect(audit.map((entry) => entry.actorType)).toEqual(["SYSTEM"]);
  });

  it("changes nothing when the same event id is delivered again", async () => {
    const { context, account, payment } = await pendingPayment({ coordinated: true });
    const event = paidEvent({ account, reference: payment.providerReference });
    await postEvent({ event });
    const again = await postEvent({ event });
    expect(again.body.status).toBe("duplicate");
    const audit = await context.db.auditLog.findMany({
      where: { operation: "payment.applySignal" },
    });
    expect(audit).toHaveLength(1);
  });

  it("never moves a paid payment backwards", async () => {
    const { context, account, payment } = await pendingPayment({ coordinated: true });
    await postEvent({ event: paidEvent({ account, reference: payment.providerReference }) });
    const expired = stripeEvent({
      type: "checkout.session.expired",
      account,
      object: { id: payment.providerReference },
    });
    expect((await postEvent({ event: expired })).status).toBe(200);
    const row = await context.db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(row.status).toBe("SUCCEEDED");
  });

  it("cancels an expired checkout", async () => {
    const { context, account, payment } = await pendingPayment({ coordinated: true });
    const event = stripeEvent({
      type: "checkout.session.expired",
      account,
      object: { id: payment.providerReference },
    });
    await postEvent({ event });
    const row = await context.db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(row.status).toBe("CANCELLED");
  });

  it("tracks partial and full refunds from the charge metadata", async () => {
    const { context, account, payment } = await pendingPayment({ coordinated: true });
    await postEvent({ event: paidEvent({ account, reference: payment.providerReference }) });
    const refund = ({ amount }: { amount: number }) =>
      stripeEvent({
        type: "charge.refunded",
        account,
        object: { amount_refunded: amount, metadata: { paymentId: payment.id } },
      });
    await postEvent({ event: refund({ amount: 25_000 }) });
    const partial = await context.db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect([partial.status, partial.refundedMinor]).toEqual(["SUCCEEDED", 25_000]);
    await postEvent({ event: refund({ amount: 125_000 }) });
    const full = await context.db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect([full.status, full.refundedMinor]).toEqual(["REFUNDED", 125_000]);
  });
});
