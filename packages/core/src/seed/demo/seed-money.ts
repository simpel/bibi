import { ok, type Result } from "../../errors/result";
import { createDeposit, sendDeposit } from "../../features/deposit/write-operations";
import { completeIntegrationConnect } from "../../features/integration/complete-connect-operation";
import { connectIntegration } from "../../features/integration/connect-operation";
import { createPayment } from "../../features/payment/create-operation";
import { recordManualPayment } from "../../features/payment/record-manual-operation";
import { startPaymentAttempt } from "../../features/payment/start-attempt-operation";
import {
  startPaymentOnboarding,
  syncPaymentAccount,
} from "../../features/payment-account/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { DEMO_SWISH_CREDENTIALS } from "./demo-payments";
import { applyDemoSignal } from "./demo-signal";
import type { DemoOrder } from "./order-types";
import { seedOrderEstimates } from "./seed-estimates";
import { missing } from "./seed-fields";
import { seedInvoice } from "./seed-invoice";
import type { DemoOrg, DemoProvider } from "./types";

type Ctx = { context: ExecuteContext };

/** Swish: the number and certificate are entered, then checked after the commit (ADR 0100). */
async function connectSwish({ context }: Ctx) {
  const input = { provider: "SWISH" as const, credentials: DEMO_SWISH_CREDENTIALS };
  return execute({ operation: connectIntegration, input, context });
}

/** An OAuth provider: the consent page's state comes back as the callback would bring it. */
async function connectOauth({ context, provider }: Ctx & { provider: DemoProvider }) {
  const started = await execute({ operation: connectIntegration, input: { provider }, context });
  if (!started.ok) return started;
  const state = new URL(started.value.authorizeUrl ?? "").searchParams.get("state") ?? "";
  const callback = { ...context, credential: "session" as const };
  const input = { provider, code: `demo-${provider}`, state };
  return execute({ operation: completeIntegrationConnect, input, context: callback });
}

/**
 * The organization's providers (ADR 0100) when an order has money: Stripe's account, then each
 * provider of `org.providers`, all memory fakes (`withDemoPayments`), no call leaves the seed.
 */
export async function activateDemoPayments({ context, org }: Ctx & { org: DemoOrg }) {
  if (!org.orders.some((order) => order.money)) return ok({ value: true as const });
  const started = await execute({ operation: startPaymentOnboarding, input: {}, context });
  if (!started.ok) return started;
  const synced = await execute({ operation: syncPaymentAccount, input: {}, context });
  if (!synced.ok) return synced;
  for (const provider of org.providers ?? []) {
    const connected =
      provider === "SWISH"
        ? await connectSwish({ context })
        : await connectOauth({ context, provider });
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

/**
 * `money.paidKr`: a card payment against the accepted quote, then Stripe's paid signal as the
 * webhook would apply it, so it is SUCCEEDED (memory provider, no Stripe call).
 */
async function seedPartialPayment({ context, order, orderId }: OrderMoneyInput) {
  const paidKr = order.money?.paidKr;
  if (!paidKr) return ok({ value: true as const });
  const quote = await context.db.quote.findFirst({ where: { orderId, quoteStatus: "ACCEPTED" } });
  if (!quote) return missing({ what: `accepted quote of order ${order.ref}` });
  const input = { quoteId: quote.id, method: "CARD" as const, amountMinor: paidKr * 100 };
  const payment = await execute({ operation: createPayment, input, context });
  if (!payment.ok) return payment;
  return applyDemoSignal({ context, paymentId: payment.value.id, kind: "attempt.succeeded" });
}

type QuoteInput = OrderMoneyInput;

async function acceptedQuote({ context, order, orderId }: QuoteInput) {
  const quote = await context.db.quote.findFirst({ where: { orderId, quoteStatus: "ACCEPTED" } });
  return quote ?? missing({ what: `accepted quote of order ${order.ref}` });
}

/**
 * `money.swishKr`: a Swish payment against the accepted quote. The customer picks Swish on the
 * pay page (`payment.startAttempt` by the public token); Swish's paid signal settles it (ADR 0100).
 */
async function seedSwishPayment({ context, order, orderId }: OrderMoneyInput) {
  const swishKr = order.money?.swishKr;
  if (!swishKr) return ok({ value: true as const });
  const quote = await acceptedQuote({ context, order, orderId });
  if ("ok" in quote) return quote;
  const input = { quoteId: quote.id, method: "SWISH" as const, amountMinor: swishKr * 100 };
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

/** `money.manual`: a bank transfer staff recorded against the accepted quote (ADR 0100). */
async function seedManualPayment({ context, order, orderId }: OrderMoneyInput) {
  const manual = order.money?.manual;
  if (!manual) return ok({ value: true as const });
  const quote = await acceptedQuote({ context, order, orderId });
  if ("ok" in quote) return quote;
  const input = {
    quoteId: quote.id,
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
