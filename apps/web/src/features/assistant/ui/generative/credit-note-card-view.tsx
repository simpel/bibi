"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { InvoiceEntry } from "@/features/payment/ui/invoice-entry";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type CreditNoteCardViewProps = GenerativeProps<"credit-note-card">;

/** A credited invoice (ADR 0100): the invoice and each of its credit notes with its status. */
export function CreditNoteCardView({ invoice }: CreditNoteCardViewProps) {
  const t = useTranslations("invoice.credit");
  const dates = useDateTimeFormat();
  const numbers = useNumberFormat();
  return (
    <Card data-slot="credit-note-card" className="shadow-none">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1 px-4 pb-4">
        <InvoiceEntry dates={dates} numbers={numbers} invoice={invoice} />
        <ul className="grid gap-1 text-sm">
          {invoice.creditNotes.map((note) => (
            <li key={note.id} className="flex flex-wrap justify-between gap-2">
              <span>{t("noteNumber", { number: note.number })}</span>
              <span className="text-muted-foreground">
                {numbers.money({ minor: note.amountMinor, currency: invoice.currency })} ·{" "}
                {t(`status.${note.status}`)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
