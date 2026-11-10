import type { Payment, PaymentAttempt } from "@bibi/db";
import type { PaymentSignal } from "./webhook-schema";

export type PaymentChange = Pick<Payment, "status" | "paidAt">;

export type NextPaymentInput = { payment: Payment; signal: PaymentSignal; now: Date };

/**
 * The payment's new state after an attempt signal, or null when nothing changes (ADR 0100). Only a
 * success moves the payment: an attempt that fails, expires or is cancelled ends that attempt alone,
 * and the customer can start another from the pay page; `payment.cancel` ends the payment. A
 * payment never moves backwards. Money that arrives on an attempt of a cancelled or failed payment
 * still settles it: it reached the venue.
 */
export function nextPaymentState({ payment, signal, now }: NextPaymentInput): PaymentChange | null {
  const { status } = payment;
  const settleable = status === "PENDING" || status === "FAILED" || status === "CANCELLED";
  if (signal.kind === "attempt.succeeded" && settleable)
    return { status: "SUCCEEDED", paidAt: now };
  return null;
}

/** The payment's money already reached the venue (paid, possibly refunded since). */
export const isSettled = ({ payment }: { payment: Pick<Payment, "status"> }) =>
  payment.status === "SUCCEEDED" || payment.status === "REFUNDED";

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
    attempt.status === "PENDING" ||
    ((attempt.status === "FAILED" || attempt.status === "CANCELLED") && next === "SUCCEEDED");
  return movable && next !== attempt.status ? next : null;
}
