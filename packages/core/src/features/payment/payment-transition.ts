import type { Payment, PaymentAttempt } from "@bibi/db";
import type { PaymentSignal } from "./webhook-schema";

export type PaymentChange = Pick<Payment, "status" | "paidAt">;

export type NextPaymentInput = { payment: Payment; signal: PaymentSignal; now: Date };

/**
 * The payment's new state after an attempt signal, or null when nothing changes. A payment never
 * moves backwards: a late `expired` after `SUCCEEDED`, or a repeated success, is ignored. Money that
 * arrives on an attempt of a cancelled or failed payment still settles it: it reached the venue.
 */
export function nextPaymentState({ payment, signal, now }: NextPaymentInput): PaymentChange | null {
  const { status } = payment;
  const open = status === "PENDING";
  const { kind } = signal;
  if (kind === "attempt.succeeded" && (open || status === "FAILED" || status === "CANCELLED")) {
    return { status: "SUCCEEDED", paidAt: now };
  }
  if ((kind === "attempt.cancelled" || kind === "attempt.expired") && open) {
    return { status: "CANCELLED", paidAt: null };
  }
  if (kind === "attempt.failed" && open) return { status: "FAILED", paidAt: null };
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
    attempt.status === "PENDING" ||
    ((attempt.status === "FAILED" || attempt.status === "CANCELLED") && next === "SUCCEEDED");
  return movable && next !== attempt.status ? next : null;
}
