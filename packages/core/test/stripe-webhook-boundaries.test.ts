import { afterEach, describe, expect, it } from "vitest";
import {
  applyPaymentSignal,
  execute,
  setPaymentProvider,
  setStripeConnectGateway,
} from "../src/index";
import { errorCode } from "./helpers";
import { installFakeGateway } from "./payment-account-helpers";
import { paidEvent, pendingPayment, postEvent, stripeEvent } from "./stripe-webhook-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

describe("Stripe webhook boundaries", () => {
  it("never touches a payment of another organization's account", async () => {
    const mine = await pendingPayment({ coordinated: true });
    const other = await pendingPayment({ coordinated: true });
    const event = paidEvent({
      account: other.account,
      reference: mine.payment.providerReference,
    });
    const posted = await postEvent({ event });
    expect(posted.body.status).toBe("unmatched");
    const row = await mine.context.db.payment.findUniqueOrThrow({ where: { id: mine.payment.id } });
    expect(row.status).toBe("PENDING");
  });

  it("acknowledges unknown accounts and events it does not act on", async () => {
    const unknown = paidEvent({ account: "acct_unknown", reference: "cs_unknown" });
    expect((await postEvent({ event: unknown })).body.status).toBe("unmatched");
    const other = stripeEvent({ type: "customer.created", account: "acct_unknown" });
    expect((await postEvent({ event: other })).body.status).toBe("ignored");
    const unpaid = stripeEvent({
      type: "checkout.session.completed",
      account: "acct_unknown",
      object: { id: "cs_x", payment_status: "unpaid" },
    });
    expect((await postEvent({ event: unpaid })).body.status).toBe("ignored");
  });

  it("refreshes the payout account status from Stripe on account.updated", async () => {
    const { context, account } = await pendingPayment({ coordinated: true });
    installFakeGateway().accountStatus = "RESTRICTED";
    const posted = await postEvent({ event: stripeEvent({ type: "account.updated", account }) });
    expect(posted.body.status).toBe("applied");
    const row = await context.db.paymentAccount.findFirstOrThrow({});
    expect(row.status).toBe("RESTRICTED");
  });

  it("refuses payment.applySignal from a user", async () => {
    const { context, account, payment } = await pendingPayment({ coordinated: true });
    const result = await execute({
      operation: applyPaymentSignal,
      input: {
        kind: "paid",
        providerAccountId: account,
        providerReference: payment.providerReference,
      },
      context,
    });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });
});
