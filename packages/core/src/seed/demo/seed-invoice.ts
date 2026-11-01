import { ok, type Result } from "../../errors/result";
import { createInvoice } from "../../features/invoice/create-operation";
import { sendInvoice } from "../../features/invoice/lifecycle-operations";
import { applyPaymentSignal } from "../../features/payment/apply-signal-operation";
import { createPayment } from "../../features/payment/create-operation";
import type { PaymentSignal } from "../../features/payment/webhook-schema";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoTicket } from "./ticket-types";

const DAY_MS = 86_400_000;

type SeedInvoiceInput = {
  context: ExecuteContext;
  ticket: DemoTicket;
  ticketId: string;
  now: Date;
};

type AtInput = { context: ExecuteContext; now: Date; day: number | undefined };

/** The context with its clock at `day` (offset from `now`); unchanged without one. */
const at = ({ context, now, day }: AtInput): ExecuteContext => {
  if (day === undefined) return context;
  const instant = new Date(now.getTime() + day * DAY_MS);
  return { ...context, now: () => instant };
};

type SignalInput = { context: ExecuteContext; paymentId: string } & Pick<
  PaymentSignal,
  "kind" | "refundedMinor"
>;

/** Stripe's signal for the payment, applied as the webhook would. */
async function signal({ context, paymentId, ...rest }: SignalInput) {
  const row = await context.db.payment.findFirstOrThrow({ where: { id: paymentId } });
  const input = { ...rest, providerAccountId: row.providerAccountId, paymentId };
  const applied = await execute({ operation: applyPaymentSignal, input, context });
  return applied.ok ? ok({ value: true as const }) : applied;
}

type Refund = { context: ExecuteContext; refundedMinor: number };

type PayInput = { context: ExecuteContext; invoiceId: string; refund: Refund | null };

/** A card payment of the invoice's open amount, marked paid; then the refund, if any. */
async function payInvoice({ context, invoiceId, refund }: PayInput) {
  const input = { invoiceId, method: "CARD" as const };
  const payment = await execute({ operation: createPayment, input, context });
  if (!payment.ok) return payment;
  const paymentId = payment.value.id;
  const paid = await signal({ context, paymentId, kind: "paid" });
  if (!paid.ok || !refund) return paid;
  const { context: refundContext, refundedMinor } = refund;
  return signal({ context: refundContext, paymentId, kind: "refunded", refundedMinor });
}

/** `money.invoice` (ADR 0077): the ticket invoiced and sent; paid in full when asked. */
export async function seedInvoice({
  context,
  ticket,
  ticketId,
  now,
}: SeedInvoiceInput): Promise<Result<true>> {
  const wanted = ticket.money?.invoice;
  if (!wanted) return ok({ value: true });
  const sentContext = at({ context, now, day: wanted.sentDay });
  const dueDate = new Date(now.getTime() + wanted.dueDay * DAY_MS);
  const input = { ticketId, dueDate };
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
