"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PaymentEntry } from "@/features/payment/ui/payment-entry";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type PaymentRefundCardViewProps = GenerativeProps<"payment-refund-card">;

/** A refunded payment (ADR 0100): the payment, what is refunded and what is left to refund. */
export function PaymentRefundCardView({ payment }: PaymentRefundCardViewProps) {
  const t = useTranslations("payment.refund");
  const dates = useDateTimeFormat();
  const numbers = useNumberFormat();
  const money = ({ minor }: { minor: number }) =>
    numbers.money({ minor, currency: payment.currency });
  return (
    <Card data-slot="payment-refund-card" className="shadow-none">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1 px-4 pb-4">
        <PaymentEntry dates={dates} numbers={numbers} payment={payment} />
        <p className="text-sm text-muted-foreground">
          {t("cardSummary", {
            refunded: money({ minor: payment.refundedMinor }),
            left: money({ minor: payment.refundableMinor }),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
