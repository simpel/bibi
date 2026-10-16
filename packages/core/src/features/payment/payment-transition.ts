import type { Payment } from "@okazi/db";
import type { PaymentSignal } from "./webhook-schema";

export type PaymentChange = Pick<Payment, "status" | "paidAt" | "refundedMinor">;

export type NextPaymentInput = { payment: Payment; signal: PaymentSignal; now: Date };

/**
 * The payment's new state after a provider signal, or null when nothing changes. A payment never
 * moves backwards: a late `expired` after `SUCCEEDED`, or a repeated `paid`, is ignored.
 */
export function nextPaymentState({ payment, signal, now }: NextPaymentInput): PaymentChange | null {
  const { status, refundedMinor } = payment;
  const open = status === "PENDING";
  if (signal.kind === "paid" && (open || status === "FAILED")) {
    return { status: "SUCCEEDED", paidAt: now, refundedMinor };
  }
  if (signal.kind === "cancelled" && open)
    return { status: "CANCELLED", paidAt: null, refundedMinor };
  if (signal.kind === "failed" && open) return { status: "FAILED", paidAt: null, refundedMinor };
  if (signal.kind === "refunded" && (status === "SUCCEEDED" || status === "REFUNDED")) {
    const refunded = Math.max(refundedMinor, signal.refundedMinor ?? 0);
    if (refunded === refundedMinor) return null;
    const full = refunded >= payment.amountMinor;
    return { status: full ? "REFUNDED" : status, paidAt: payment.paidAt, refundedMinor: refunded };
  }
  return null;
}
