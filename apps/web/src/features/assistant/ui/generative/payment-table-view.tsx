"use client";

import { Card } from "@bibi/ui";
import { PaymentList } from "@/features/payment/ui/payment-list";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type PaymentTableViewProps = GenerativeProps<"payment-table">;

/** A page of payments requested for a ticket, newest first. */
export function PaymentTableView({ items, nextCursor }: PaymentTableViewProps) {
  return (
    <Card data-slot="payment-table" className="px-4 shadow-none">
      <PaymentList payments={items} />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
