import type { PublicPaymentDto } from "@okazi/core/schemas";

export type PaymentOutcome = "pay" | "invoice" | "paid" | "expired" | "unavailable";

export type PaymentOutcomeInput = { payment: PublicPaymentDto };

/** Which of the page's states a public payment is in. */
export function paymentOutcome({ payment }: PaymentOutcomeInput): PaymentOutcome {
  if (payment.status === "SUCCEEDED") return "paid";
  if (payment.status === "EXPIRED") return "expired";
  if (payment.status !== "PENDING") return "unavailable";
  return payment.method === "INVOICE" || !payment.paymentUrl ? "invoice" : "pay";
}
