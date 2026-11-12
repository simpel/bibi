import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { ProviderSignal } from "../../providers/signal";
import { notFound } from "../../shared/errors";
import { applyInvoicePaymentSignal } from "./invoice-payment-signal";

type Context = Pick<OperationContext, "db" | "organizationId" | "actor" | "recordChange">;

export type DepositSignalInput = { context: Context; depositId: string; signal: ProviderSignal };

export type DepositSignalOutcome = {
  invoiceId: string;
  orderId: string;
  paymentId: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED" | null;
  changed: boolean;
};

/**
 * A payment booked on, or removed from, a deposit's prepayment invoice in the accounting system
 * (ADR 0106), applied like one on an invoice. Other signals about it change nothing: a prepayment
 * invoice is voided by `deposit.void`, which credits it there.
 */
export async function applyDepositSignal({
  context,
  depositId,
  signal,
}: DepositSignalInput): Promise<Result<DepositSignalOutcome>> {
  const row = await context.db.deposit.findFirst({ where: { id: depositId } });
  if (!row?.provider) return notFound({ entity: "Deposit" });
  const base = { invoiceId: depositId, orderId: row.orderId };
  if (signal.kind !== "invoice.payment_recorded" && signal.kind !== "invoice.payment_removed") {
    return ok({ value: { ...base, paymentId: null, status: null, changed: false } });
  }
  const invoice = { ...row, provider: row.provider, kind: "deposit" as const };
  const { payment, changed } = await applyInvoicePaymentSignal({ context, invoice, signal });
  return ok({
    value: { ...base, paymentId: payment?.id ?? null, status: payment?.status ?? null, changed },
  });
}
