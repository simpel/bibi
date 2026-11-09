import { ok, type Result } from "../../errors/result";
import { createInvoice } from "../../features/invoice/create-operation";
import { creditInvoice } from "../../features/invoice/credit-operation";
import { sendInvoice } from "../../features/invoice/lifecycle-operations";
import { getInvoice } from "../../features/invoice/operations";
import { syncInvoice } from "../../features/invoice/sync-operation";
import { createPayment } from "../../features/payment/create-operation";
import { refundPayment } from "../../features/payment/refund-operation";
import { updatePaymentSettings } from "../../features/payment-account/settings-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { nowOf } from "../../time/now";
import { demoFake } from "./demo-payments";
import { applyDemoSignal } from "./demo-signal";
import type { DemoInvoice, DemoOrder } from "./order-types";
import { atDay as at } from "./seed-clock";
import { missing } from "./seed-fields";

const DAY_MS = 86_400_000;

type SeedInvoiceInput = {
  context: ExecuteContext;
  order: DemoOrder;
  orderId: string;
  now: Date;
};

type Refund = { context: ExecuteContext; refundedMinor: number };

type PayInput = { context: ExecuteContext; invoiceId: string; refund: Refund | null };

/**
 * A card payment of the invoice's open amount, marked paid; then the refund, if any, started in
 * Bibi (`payment.refund`) and confirmed by the provider's signal (ADR 0100).
 */
async function payInvoice({ context, invoiceId, refund }: PayInput) {
  const input = { invoiceId, method: "CARD" as const };
  const payment = await execute({ operation: createPayment, input, context });
  if (!payment.ok) return payment;
  const paymentId = payment.value.id;
  const paid = await applyDemoSignal({ context, paymentId, kind: "attempt.succeeded" });
  if (!paid.ok || !refund) return paid;
  const { context: refundContext, refundedMinor } = refund;
  const refunded = await execute({
    operation: refundPayment,
    input: { id: paymentId, amountMinor: refundedMinor },
    context: refundContext,
  });
  if (!refunded.ok) return refunded;
  const row = await refundContext.db.paymentRefund.findFirst({
    where: { paymentId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return applyDemoSignal({
    context: refundContext,
    paymentId,
    kind: "refund.succeeded",
    ...(row ? { refundId: row.id } : {}),
  });
}

type LedgerProvider = NonNullable<DemoInvoice["provider"]>;
type LedgerInput = { context: ExecuteContext; invoiceId: string; provider: LedgerProvider };

/**
 * The ledger provider reports the whole amount due as paid (its memory fake's payment list), then
 * `invoice.sync` mirrors it as a payment, as the Topics stream or the poll would (ADR 0100).
 */
async function payInLedger({ context, invoiceId, provider }: LedgerInput) {
  const fake = demoFake({ key: provider });
  if (!fake) return missing({ what: `fake of ${provider}` });
  const read = await execute({ operation: getInvoice, input: { id: invoiceId }, context });
  if (!read.ok) return read;
  fake.payments.push({
    reference: `${provider.toLowerCase()}-pay-${read.value.number}`,
    amountMinor: read.value.amountDueMinor,
    paidAt: nowOf({ context }),
  });
  const synced = await execute({ operation: syncInvoice, input: { id: invoiceId }, context });
  return synced.ok ? ok({ value: true as const }) : synced;
}

/** The INVOICE route set before the send, so each demo invoice is raised where it should be. */
async function routeInvoices({ context, provider }: Pick<LedgerInput, "context" | "provider">) {
  const routes = [{ method: "INVOICE" as const, provider }];
  return execute({ operation: updatePaymentSettings, input: { routes }, context });
}

type CreditInput = Pick<LedgerInput, "context" | "invoiceId"> & {
  credit: NonNullable<DemoInvoice["credit"]>;
};

/** A credit note on the open invoice, confirmed by its provider where it has one (ADR 0100). */
async function creditOpenInvoice({ context, invoiceId, credit }: CreditInput) {
  const input = { invoiceId, amountMinor: credit.kr * 100, reason: credit.reason };
  const credited = await execute({ operation: creditInvoice, input, context });
  return credited.ok ? ok({ value: true as const }) : credited;
}

/** `money.invoice` (ADR 0077): the order invoiced and sent; paid in full when asked. */
export async function seedInvoice({
  context,
  order,
  orderId,
  now,
}: SeedInvoiceInput): Promise<Result<true>> {
  const wanted = order.money?.invoice;
  if (!wanted) return ok({ value: true });
  const sentContext = at({ context, now, day: wanted.sentDay });
  const dueDate = new Date(now.getTime() + wanted.dueDay * DAY_MS);
  const input = { orderId, dueDate };
  if (wanted.provider) {
    const routed = await routeInvoices({ context, provider: wanted.provider });
    if (!routed.ok) return routed;
  }
  const draft = await execute({ operation: createInvoice, input, context: sentContext });
  if (!draft.ok) return draft;
  const id = draft.value.id;
  const sent = await execute({ operation: sendInvoice, input: { id }, context: sentContext });
  if (!sent.ok) return sent;
  if (wanted.credit) {
    const credited = await creditOpenInvoice({ context, invoiceId: id, credit: wanted.credit });
    if (!credited.ok) return credited;
  }
  if (!wanted.paid) return ok({ value: true });
  const refund = wanted.refund
    ? {
        context: at({ context, now, day: wanted.refund.day }),
        refundedMinor: wanted.refund.kr * 100,
      }
    : null;
  const paidContext = at({ context, now, day: wanted.paidDay });
  if (wanted.provider) {
    return payInLedger({ context: paidContext, invoiceId: id, provider: wanted.provider });
  }
  return payInvoice({ context: paidContext, invoiceId: id, refund });
}
