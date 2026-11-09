import type { Payment, PaymentAttempt } from "@bibi/db";
import type { PaymentSignal } from "./webhook-schema";

export type PaymentChange = Pick<Payment, "status" | "paidAt" | "refundedMinor">;

export type NextPaymentInput = { payment: Payment; signal: PaymentSignal; now: Date };

/**
 * The payment's new state after a provider signal, or null when nothing changes. A payment never
 * moves backwards: a late `expired` after `SUCCEEDED`, or a repeated success, is ignored.
 */
export function nextPaymentState({ payment, signal, now }: NextPaymentInput): PaymentChange | null {
  const { status, refundedMinor } = payment;
  const open = status === "PENDING";
  const { kind } = signal;
  if (kind === "attempt.succeeded" && (open || status === "FAILED")) {
    return { status: "SUCCEEDED", paidAt: now, refundedMinor };
  }
  if ((kind === "attempt.cancelled" || kind === "attempt.expired") && open) {
    return { status: "CANCELLED", paidAt: null, refundedMinor };
  }
  if (kind === "attempt.failed" && open) return { status: "FAILED", paidAt: null, refundedMinor };
  if (kind === "refund.succeeded" && (status === "SUCCEEDED" || status === "REFUNDED")) {
    const refunded = Math.max(refundedMinor, signal.refundedTotalMinor ?? 0);
    if (refunded === refundedMinor) return null;
    const full = refunded >= payment.amountMinor;
    return { status: full ? "REFUNDED" : status, paidAt: payment.paidAt, refundedMinor: refunded };
  }
  return null;
}

const ATTEMPT_STATUS = {
  "attempt.succeeded": "SUCCEEDED",
  "attempt.failed": "FAILED",
  "attempt.expired": "EXPIRED",
  "attempt.cancelled": "CANCELLED",
} as const;

export type NextAttemptInput = { attempt: PaymentAttempt; signal: PaymentSignal };

/** The attempt's new status after a signal about it; only an open or failed attempt moves. */
export function nextAttemptStatus({ attempt, signal }: NextAttemptInput) {
  const kind = signal.kind;
  if (!(kind in ATTEMPT_STATUS)) return null;
  const next = ATTEMPT_STATUS[kind as keyof typeof ATTEMPT_STATUS];
  const movable =
    attempt.status === "PENDING" || (attempt.status === "FAILED" && next === "SUCCEEDED");
  return movable && next !== attempt.status ? next : null;
}
