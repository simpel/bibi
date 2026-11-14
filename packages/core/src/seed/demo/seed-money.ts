import { ok, type Result } from "../../errors/result";
import { createDeposit, sendDeposit } from "../../features/deposit/write-operations";
import { createPayment } from "../../features/payment/create-operation";
import { recordManualPayment } from "../../features/payment/record-manual-operation";
import { refundPayment } from "../../features/payment/refund-operation";
import { retryRefunds } from "../../features/payment/retry-refunds-operation";
import { startPaymentAttempt } from "../../features/payment/start-attempt-operation";
import {
  startPaymentOnboarding,
  syncPaymentAccount,
} from "../../features/payment-account/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { ledgerProviderKeys } from "../../providers/registry";
import { connectDemoOauth, connectDemoSwish } from "./demo-connect";
import { applyDemoSignal } from "./demo-signal";
import type { DemoOrder } from "./order-types";
import { seedOrderEstimates } from "./seed-estimates";
import { seedInvoice } from "./seed-invoice";
import type { DemoOrg } from "./types";

type Ctx = { context: ExecuteContext };

/**
 * The organization's providers (ADR 0100) when an order has money: Stripe's account, then each
 * provider of `org.providers`, all memory fakes (`withDemoPayments`), no call leaves the seed.
 * Only the first accounting system connects here (ADR 0108); an invoice that needs another one
 * switches to it (`ensureDemoLedger`).
 */
export async function activateDemoPayments({ context, org }: Ctx & { org: DemoOrg }) {
  if (!org.orders.some((order) => order.money)) return ok({ value: true as const });
  const started = await execute({ operation: startPaymentOnboarding, input: {}, context });
  if (!started.ok) return started;
  const synced = await execute({ operation: syncPaymentAccount, input: {}, context });
  if (!synced.ok) return synced;
  const ledgers = new Set<string>(ledgerProviderKeys());
  let ledgerConnected = false;
  for (const provider of org.providers ?? []) {
    if (ledgers.has(provider)) {
      if (ledgerConnected) continue;
      ledgerConnected = true;
    }
    const connected =
      provider === "SWISH"
        ? await connectDemoSwish({ context })
        : await connectDemoOauth({ context, provider });
    if (!connected.ok) return connected;
  }
  return ok({ value: true as const });
}

type OrderMoneyInput = Ctx & { order: DemoOrder; orderId: string };

/** `money.deposit`: a deposit request on the order, sent to the customer (ADR 0057). */
async function seedDeposit({ context, order, orderId }: OrderMoneyInput): Promise<Result<true>> {
  const deposit = order.money?.deposit;
  if (!deposit) return ok({ value: true });
  const input = { orderId, description: deposit.description, amountMinor: deposit.amountKr * 100 };
  const draft = await execute({ operation: createDeposit, input, context });
  if (!draft.ok) return draft;
  const sent = await execute({ operation: sendDeposit, input: { id: draft.value.id }, context });
  return sent.ok ? ok({ value: true }) : sent;
}

type PaymentDepositInput = Ctx & { orderId: string; kr: number; description: string };

/**
 * A SENT deposit for one demo payment: a quote is never paid directly, accepting it leads to its
 * deposit (ADR 0106), raised in the accounting system as a prepayment invoice.
 */
async function paymentDeposit({
  context,
  orderId,
  kr,
  description,
}: PaymentDepositInput): Promise<Result<string>> {
  const input = { orderId, description, amountMinor: kr * 100 };
  const draft = await execute({ operation: createDeposit, input, context });
  if (!draft.ok) return draft;
  const sent = await execute({ operation: sendDeposit, input: { id: draft.value.id }, context });
  return sent.ok ? ok({ value: sent.value.id }) : sent;
}

/**
 * `money.paidKr`: a card payment against a deposit, then Stripe's paid signal as the webhook would
 * apply it, so it is SUCCEEDED (memory provider, no Stripe call).
 */
async function seedPartialPayment({ context, order, orderId }: OrderMoneyInput) {
  const paidKr = order.money?.paidKr;
  if (!paidKr) return ok({ value: true as const });
  const deposit = await paymentDeposit({ context, orderId, kr: paidKr, description: "Card" });
  if (!deposit.ok) return deposit;
  const input = { depositId: deposit.value, method: "CARD" as const };
  const payment = await execute({ operation: createPayment, input, context });
  if (!payment.ok) return payment;
  const paymentId = payment.value.id;
  const paid = await applyDemoSignal({ context, paymentId, kind: "attempt.succeeded" });
  if (!paid.ok) return paid;
  return seedLostRefund({ context, paymentId, kr: order.money?.lostRefundKr });
}

const RETRY_AFTER_MS = 20 * 60_000;

/**
 * `money.lostRefundKr`: a refund started in Bibi whose provider signal never comes; the refund
 * retry job, run as the worker would 20 minutes later, reads it at the provider and completes it.
 */
async function seedLostRefund({
  context,
  paymentId,
  kr,
}: Ctx & { paymentId: string; kr: number | undefined }) {
  if (!kr) return ok({ value: true as const });
  const input = { id: paymentId, amountMinor: kr * 100, reason: "One guest fewer" };
  const refunded = await execute({ operation: refundPayment, input, context });
  if (!refunded.ok) return refunded;
  const later = { ...context, now: () => new Date(Date.now() + RETRY_AFTER_MS) };
  const retried = await execute({ operation: retryRefunds, input: {}, context: later });
  return retried.ok ? ok({ value: true as const }) : retried;
}

/**
 * `money.swishKr`: a Swish payment against a deposit. The customer picks Swish on the pay page
 * (`payment.startAttempt` by the public token); Swish's paid signal settles it (ADR 0100).
 */
async function seedSwishPayment({ context, order, orderId }: OrderMoneyInput) {
  const swishKr = order.money?.swishKr;
  if (!swishKr) return ok({ value: true as const });
  const deposit = await paymentDeposit({ context, orderId, kr: swishKr, description: "Swish" });
  if (!deposit.ok) return deposit;
  const input = { depositId: deposit.value, method: "SWISH" as const };
  const payment = await execute({ operation: createPayment, input, context });
  if (!payment.ok) return payment;
  const row = await context.db.payment.findFirstOrThrow({ where: { id: payment.value.id } });
  const started = await execute({
    operation: startPaymentAttempt,
    input: { token: row.publicToken, method: "SWISH" as const },
    context,
  });
  if (!started.ok) return started;
  return applyDemoSignal({ context, paymentId: row.id, kind: "attempt.succeeded" });
}

/** `money.manual`: a bank transfer staff recorded against a deposit (ADR 0100). */
async function seedManualPayment({ context, order, orderId }: OrderMoneyInput) {
  const manual = order.money?.manual;
  if (!manual) return ok({ value: true as const });
  const description = manual.note;
  const deposit = await paymentDeposit({ context, orderId, kr: manual.kr, description });
  if (!deposit.ok) return deposit;
  const input = {
    depositId: deposit.value,
    amountMinor: manual.kr * 100,
    paidAt: new Date(),
    note: manual.note,
  };
  const recorded = await execute({ operation: recordManualPayment, input, context });
  return recorded.ok ? ok({ value: true as const }) : recorded;
}

/** The order's demo money (`order.money`): a deposit request, payments, an invoice. */
export async function seedOrderMoney({
  context,
  order,
  orderId,
}: OrderMoneyInput): Promise<Result<true>> {
  const estimated = await seedOrderEstimates({ context, order, orderId });
  if (!estimated.ok) return estimated;
  const deposit = await seedDeposit({ context, order, orderId });
  if (!deposit.ok) return deposit;
  const paid = await seedPartialPayment({ context, order, orderId });
  if (!paid.ok) return paid;
  const swish = await seedSwishPayment({ context, order, orderId });
  if (!swish.ok) return swish;
  const manual = await seedManualPayment({ context, order, orderId });
  if (!manual.ok) return manual;
  return seedInvoice({ context, order, orderId, now: new Date() });
}
