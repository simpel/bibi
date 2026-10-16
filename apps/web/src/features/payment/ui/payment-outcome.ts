import type { PublicPaymentDto } from "@okazi/core/schemas";

export type PaymentOutcome = "pay" | "processing" | "invoice" | "paid" | "expired" | "unavailable";

export type PaymentOutcomeInput = {
  payment: PublicPaymentDto;
  /** The customer just came back from Stripe's checkout (`?checkout=success`). */
  returning?: boolean;
};

/** Which of the page's states a public payment is in. */
export function paymentOutcome({
  payment,
  returning = false,
}: PaymentOutcomeInput): PaymentOutcome {
  if (payment.status === "SUCCEEDED") return "paid";
  if (payment.status === "EXPIRED") return "expired";
  if (payment.status !== "PENDING") return "unavailable";
  if (payment.method === "INVOICE" || !payment.paymentUrl) return "invoice";
  // Stripe has returned the customer but the webhook has not marked the payment paid yet.
  return returning ? "processing" : "pay";
}
