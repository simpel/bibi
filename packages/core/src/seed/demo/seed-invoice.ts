import { ok, type Result } from "../../errors/result";
import { createInvoice } from "../../features/invoice/create-operation";
import { sendInvoice } from "../../features/invoice/lifecycle-operations";
import { applyPaymentSignal } from "../../features/payment/apply-signal-operation";
import { createPayment } from "../../features/payment/create-operation";
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

/** A card payment of the invoice's open amount, marked paid as the Stripe webhook would. */
async function payInvoice({ context, invoiceId }: { context: ExecuteContext; invoiceId: string }) {
  const input = { invoiceId, method: "CARD" as const };
  const payment = await execute({ operation: createPayment, input, context });
  if (!payment.ok) return payment;
  const row = await context.db.payment.findFirstOrThrow({ where: { id: payment.value.id } });
  const signal = {
    kind: "paid" as const,
    providerAccountId: row.providerAccountId,
    paymentId: row.id,
  };
  const paid = await execute({ operation: applyPaymentSignal, input: signal, context });
  return paid.ok ? ok({ value: true as const }) : paid;
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
  const dueDate = new Date(now.getTime() + wanted.dueDay * DAY_MS);
  const draft = await execute({ operation: createInvoice, input: { ticketId, dueDate }, context });
  if (!draft.ok) return draft;
  const sent = await execute({ operation: sendInvoice, input: { id: draft.value.id }, context });
  if (!sent.ok) return sent;
  return wanted.paid ? payInvoice({ context, invoiceId: draft.value.id }) : ok({ value: true });
}
