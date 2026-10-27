"use client";

import { Card } from "@bibi/ui";
import { PaymentEntry } from "@/features/payment/ui/payment-entry";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type PaymentCardViewProps = GenerativeProps<"payment-card">;

/** One requested payment: amount, method, status and the customer's payment link. */
export function PaymentCardView({ payment }: PaymentCardViewProps) {
  const dates = useDateTimeFormat();
  const numbers = useNumberFormat();
  return (
    <Card data-slot="payment-card" className="px-4 shadow-none">
      <PaymentEntry dates={dates} numbers={numbers} payment={payment} />
    </Card>
  );
}
