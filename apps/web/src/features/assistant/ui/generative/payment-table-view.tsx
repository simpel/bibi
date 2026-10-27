"use client";

import { Card } from "@bibi/ui";
import { PaymentList } from "@/features/payment/ui/payment-list";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type PaymentTableViewProps = GenerativeProps<"payment-table">;

/** A page of payments requested for a ticket, newest first. */
export function PaymentTableView({ items, nextCursor }: PaymentTableViewProps) {
  const dates = useDateTimeFormat();
  const numbers = useNumberFormat();
  return (
    <Card data-slot="payment-table" className="px-4 shadow-none">
      <PaymentList dates={dates} numbers={numbers} payments={items} />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
