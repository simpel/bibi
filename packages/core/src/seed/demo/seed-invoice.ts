import { ok, type Result } from "../../errors/result";
import { createInvoice } from "../../features/invoice/create-operation";
import { sendInvoice } from "../../features/invoice/lifecycle-operations";
import { createPayment } from "../../features/payment/create-operation";
import { refundPayment } from "../../features/payment/refund-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { applyDemoSignal } from "./demo-signal";
import type { DemoOrder } from "./order-types";
import { atDay as at } from "./seed-clock";

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
  const draft = await execute({ operation: createInvoice, input, context: sentContext });
  if (!draft.ok) return draft;
  const id = draft.value.id;
  const sent = await execute({ operation: sendInvoice, input: { id }, context: sentContext });
  if (!sent.ok) return sent;
  if (!wanted.paid) return ok({ value: true });
  const refund = wanted.refund
    ? {
        context: at({ context, now, day: wanted.refund.day }),
        refundedMinor: wanted.refund.kr * 100,
      }
    : null;
  const paidContext = at({ context, now, day: wanted.paidDay });
  return payInvoice({ context: paidContext, invoiceId: id, refund });
}
