import type { DateTimeFormat, InvoiceDto, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PaidOf } from "./paid-of";
import { ReceivableBadges } from "./receivable-badges";

/** An invoice as the server (Date) or a tool result (ISO string) carries it. */
export type InvoiceValue = Omit<
  InvoiceDto,
  "createdAt" | "updatedAt" | "dueDate" | "statusChangedAt" | "lines"
> & { dueDate: Date | string | null };

export type InvoiceEntryProps = {
  invoice: InvoiceValue;
  actions?: ReactNode;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
};

/** One invoice: its number, what is paid of its total, due date, status and progress. */
export function InvoiceEntry({ invoice, actions, dates: format, numbers }: InvoiceEntryProps) {
  const t = useTranslations("invoice");
  const due = invoice.dueDate ? new Date(invoice.dueDate) : null;
  return (
    <article data-slot="invoice-entry" className="flex flex-wrap items-center gap-2 py-3 text-sm">
      <span className="font-medium">{t("number", { number: invoice.number })}</span>
      <PaidOf
        numbers={numbers}
        paidMinor={invoice.paidMinor}
        amountMinor={invoice.totalInclVatMinor}
        currency={invoice.currency}
      />
      <ReceivableBadges status={invoice.status} progress={invoice.progress} />
      {due ? (
        <time className="text-xs text-muted-foreground" dateTime={due.toISOString()}>
          {t("due", { date: format.date({ instant: due }) })}
        </time>
      ) : null}
      {actions ? <div className="ml-auto flex gap-2">{actions}</div> : null}
    </article>
  );
}
