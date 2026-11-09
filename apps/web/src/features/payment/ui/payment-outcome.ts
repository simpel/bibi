import type { PublicPaymentDto } from "@bibi/core/schemas";

export type PaymentOutcome = "pay" | "processing" | "invoice" | "paid" | "expired" | "unavailable";

export type PaymentOutcomeInput = {
  payment: PublicPaymentDto;
  /** The customer just came back from a hosted checkout (`?checkout=success`). */
  returning?: boolean;
};

/** The methods the customer can start here (card checkout, Swish); invoices are sent instead. */
export function pickableMethods({ payment }: Pick<PaymentOutcomeInput, "payment">) {
  return payment.methods.flatMap((method) =>
    method === "CARD" || method === "SWISH" ? [method] : [],
  );
}

/** Which of the page's states a public payment is in. */
export function paymentOutcome({
  payment,
  returning = false,
}: PaymentOutcomeInput): PaymentOutcome {
  if (payment.status === "SUCCEEDED") return "paid";
  if (payment.status === "EXPIRED") return "expired";
  if (payment.status !== "PENDING") return "unavailable";
  // The provider has returned the customer but its signal has not marked the payment paid yet.
  if (returning) return "processing";
  if (pickableMethods({ payment }).length > 0) return "pay";
  return payment.method === "INVOICE" || !payment.paymentUrl ? "invoice" : "pay";
}
