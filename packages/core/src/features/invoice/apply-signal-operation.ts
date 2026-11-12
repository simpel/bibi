import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { ProviderSignalSchema } from "../../providers/signal";
import { notFound } from "../../shared/errors";
import { notifyPaymentReceived } from "../notification/follow-ups";
import { closeOpenAttempts } from "../payment/close-attempts";
import { PaymentStatusSchema } from "../payment/schema";
import { applyDepositSignal } from "./deposit-signal";
import { applyInvoicePaymentSignal } from "./invoice-payment-signal";
import { moveInvoice } from "./move-invoice";

const InvoiceSignalInputSchema = z
  .object({
    invoiceId: z.string().min(1).optional().describe("The invoice the signal is about"),
    depositId: z
      .string()
      .min(1)
      .optional()
      .describe("Or the deposit whose prepayment invoice it is about (ADR 0106)"),
    signal: ProviderSignalSchema,
  })
  .refine((input) => Boolean(input.invoiceId) !== Boolean(input.depositId), {
    message: "Give exactly one of invoiceId and depositId",
  });

const InvoiceSignalResultSchema = z.object({
  invoiceId: z.string().describe("The invoice, or the deposit, the signal was about"),
  orderId: z.string(),
  paymentId: z.string().nullable(),
  status: PaymentStatusSchema.nullable().describe("The payment's status; null for a void"),
  changed: z.boolean(),
});

/**
 * Applies a provider signal about an invoice it raised (ADR 0100): a payment booked or removed
 * there, or the invoice voided there. SYSTEM only: a provider's webhook, stream or `invoice.sync`
 * runs it, so it is not part of `createCoreOperations` and has no adapters. Idempotent. A new
 * payment notifies the order's people (`notifyPaymentReceived`).
 */
export const applyInvoiceSignal = defineOperation({
  name: "invoice.applySignal",
  kind: "command",
  description: "Apply a provider event to an invoice raised there (provider events only).",
  input: InvoiceSignalInputSchema,
  output: InvoiceSignalResultSchema,
  permission: "payment:write",
  approval: false,
  followUp: notifyPaymentReceived,
  handler: async ({ input: { invoiceId, depositId, signal }, context }) => {
    if (context.actor.type !== "system") {
      const message = "Invoices are updated by the provider's events only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    if (depositId) return applyDepositSignal({ context, depositId, signal });
    if (!invoiceId) return notFound({ entity: "Invoice" });
    const row = await context.db.invoice.findFirst({ where: { id: invoiceId } });
    if (!row?.provider) return notFound({ entity: "Invoice" });
    const base = { invoiceId, orderId: row.orderId };
    if (signal.kind === "invoice.voided") {
      if (row.status === "VOID") {
        return ok({ value: { ...base, paymentId: null, status: null, changed: false } });
      }
      const moved = await moveInvoice({ context, id: invoiceId, to: "VOID" });
      if (!moved.ok) return moved;
      return ok({ value: { ...base, paymentId: null, status: null, changed: true } });
    }
    if (signal.kind !== "invoice.payment_recorded" && signal.kind !== "invoice.payment_removed") {
      return ok({ value: { ...base, paymentId: null, status: null, changed: false } });
    }
    const invoice = { ...row, provider: row.provider };
    const { payment, changed } = await applyInvoicePaymentSignal({ context, invoice, signal });
    return ok({
      value: { ...base, paymentId: payment?.id ?? null, status: payment?.status ?? null, changed },
    });
  },
  // Paid in the ledger provider: open card or Swish attempts on the invoice close (ADR 0100).
  external: async ({ output, context }) => {
    if (output.changed && output.status === "SUCCEEDED" && output.paymentId) {
      await closeOpenAttempts({ context, paymentId: output.paymentId });
    }
    return ok({ value: output });
  },
});
