"use client";

import { Card } from "@bibi/ui";
import { InvoiceEntry } from "@/features/payment/ui/invoice-entry";
import type { GenerativeProps } from "./generative-props";

export type InvoiceCardViewProps = GenerativeProps<"invoice-card">;

/** One invoice: number, what is paid of its total, due date, status and progress. */
export function InvoiceCardView({ invoice }: InvoiceCardViewProps) {
  return (
    <Card data-slot="invoice-card" className="px-4 shadow-none">
      <InvoiceEntry invoice={invoice} />
    </Card>
  );
}
