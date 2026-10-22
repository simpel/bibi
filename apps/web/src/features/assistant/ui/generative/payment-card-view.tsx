"use client";

import { Card } from "@bibi/ui";
import { PaymentEntry } from "@/features/payment/ui/payment-entry";
import type { GenerativeProps } from "./generative-props";

export type PaymentCardViewProps = GenerativeProps<"payment-card">;

/** One requested payment: amount, method, status and the customer's payment link. */
export function PaymentCardView({ payment }: PaymentCardViewProps) {
  return (
    <Card data-slot="payment-card" className="px-4 shadow-none">
      <PaymentEntry payment={payment} />
    </Card>
  );
}
