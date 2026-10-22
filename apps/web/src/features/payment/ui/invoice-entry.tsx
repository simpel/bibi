import type { InvoiceDto } from "@bibi/core/schemas";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PaidOf } from "./paid-of";
import { ReceivableBadges } from "./receivable-badges";

/** An invoice as the server (Date) or a tool result (ISO string) carries it. */
export type InvoiceValue = Omit<
  InvoiceDto,
  "createdAt" | "updatedAt" | "dueDate" | "statusChangedAt" | "lines"
> & { dueDate: Date | string | null };

export type InvoiceEntryProps = { invoice: InvoiceValue; actions?: ReactNode };

/** One invoice: its number, what is paid of its total, due date, status and progress. */
export function InvoiceEntry({ invoice, actions }: InvoiceEntryProps) {
  const t = useTranslations("invoice");
  const format = useFormatter();
  const due = invoice.dueDate ? new Date(invoice.dueDate) : null;
  return (
    <article data-slot="invoice-entry" className="flex flex-wrap items-center gap-2 py-3 text-sm">
      <span className="font-medium">{t("number", { number: invoice.number })}</span>
      <PaidOf
        paidMinor={invoice.paidMinor}
        amountMinor={invoice.totalInclVatMinor}
        currency={invoice.currency}
      />
      <ReceivableBadges status={invoice.status} progress={invoice.progress} />
      {due ? (
        <time className="text-xs text-muted-foreground" dateTime={due.toISOString()}>
          {t("due", { date: format.dateTime(due, { dateStyle: "medium" }) })}
        </time>
      ) : null}
      {actions ? <div className="ml-auto flex gap-2">{actions}</div> : null}
    </article>
  );
}
