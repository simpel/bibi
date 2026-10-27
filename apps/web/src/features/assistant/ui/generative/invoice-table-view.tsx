"use client";

import { Card } from "@bibi/ui";
import { InvoiceEntry } from "@/features/payment/ui/invoice-entry";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type InvoiceTableViewProps = GenerativeProps<"invoice-table">;

/** A page of a ticket's invoices, newest first. */
export function InvoiceTableView({ items, nextCursor }: InvoiceTableViewProps) {
  const dates = useDateTimeFormat();
  const numbers = useNumberFormat();
  return (
    <Card data-slot="invoice-table" className="px-4 shadow-none">
      <ol className="divide-y">
        {items.map((invoice) => (
          <li key={invoice.id}>
            <InvoiceEntry dates={dates} numbers={numbers} invoice={invoice} />
          </li>
        ))}
      </ol>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
