import type {
  DateTimeFormat,
  DepositDto,
  InvoiceDto,
  NumberFormat,
  ReceivableSettlement,
  TicketBalanceDto,
} from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { DepositEntry } from "./deposit-entry";
import { InvoiceEntry } from "./invoice-entry";
import { InvoiceLines } from "./invoice-lines";
import { PaidOf } from "./paid-of";
import { ReceivableActions } from "./receivable-actions";
import { ReceivableBadges } from "./receivable-badges";
import { RequestPaymentButton } from "./request-payment-button";

/** The viewer's formats, from the server (`getDateTimeFormat`, `getNumberFormat`). */
type Formats = { dates: DateTimeFormat; numbers: NumberFormat };

type QuoteRowProps = { quote: ReceivableSettlement; canWrite: boolean } & Formats;

/** A sent or accepted quote as a receivable: what is paid of its total. */
function QuoteRow({ quote, canWrite, numbers }: QuoteRowProps) {
  const t = useTranslations("payment");
  return (
    <li className="flex flex-wrap items-center gap-2 py-3 text-sm">
      <span className="font-medium">{t("quoteVersion")}</span>
      <PaidOf paidMinor={quote.paidMinor} amountMinor={quote.amountMinor} numbers={numbers} />
      <ReceivableBadges progress={quote.progress} />
      {canWrite && quote.openMinor > 0 ? (
        <div className="ml-auto">
          <RequestPaymentButton target={{ quoteId: quote.id }} openMinor={quote.openMinor} />
        </div>
      ) : null}
    </li>
  );
}

type DepositRowProps = { deposit: DepositDto; canWrite: boolean } & Formats;

function DepositRow({ deposit, canWrite, numbers }: DepositRowProps) {
  const t = useTranslations("deposit");
  const { id, status, openMinor } = deposit;
  const confirm = t("voidConfirm", { description: deposit.description });
  const actions = canWrite ? (
    <ReceivableActions {...{ kind: "deposit", id, status, openMinor }} voidConfirm={confirm} />
  ) : null;
  return (
    <li>
      <DepositEntry deposit={deposit} actions={actions} numbers={numbers} />
    </li>
  );
}

type InvoiceRowProps = { invoice: InvoiceDto; canWrite: boolean } & Formats;

function InvoiceRow({ invoice, canWrite, ...formats }: InvoiceRowProps) {
  const t = useTranslations("invoice");
  const { id, status, openMinor } = invoice;
  const confirm = t("voidConfirm", { number: invoice.number });
  const actions = canWrite ? (
    <ReceivableActions {...{ kind: "invoice", id, status, openMinor }} voidConfirm={confirm} />
  ) : null;
  return (
    <li>
      <InvoiceEntry invoice={invoice} actions={actions} {...formats} />
      <InvoiceLines invoice={invoice} />
    </li>
  );
}

export type ReceivableListProps = {
  balance: TicketBalanceDto;
  deposits: readonly DepositDto[];
  invoices: readonly InvoiceDto[];
  canWrite: boolean;
} & Formats;

/** The ticket's receivables (ADR 0057): sent quotes, deposit requests and invoices. */
export function ReceivableList(props: ReceivableListProps) {
  const { balance, deposits, invoices, canWrite, dates, numbers } = props;
  const formats = { dates, numbers };
  const t = useTranslations("payment");
  const quotes = balance.receivables.filter((receivable) => receivable.kind === "QUOTE");
  if (quotes.length + deposits.length + invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noReceivables")}</p>;
  }
  return (
    <ol data-slot="receivable-list" className="divide-y">
      {quotes.map((quote) => (
        <QuoteRow key={quote.id} quote={quote} canWrite={canWrite} {...formats} />
      ))}
      {deposits.map((deposit) => (
        <DepositRow key={deposit.id} deposit={deposit} canWrite={canWrite} {...formats} />
      ))}
      {invoices.map((invoice) => (
        <InvoiceRow key={invoice.id} invoice={invoice} canWrite={canWrite} {...formats} />
      ))}
    </ol>
  );
}
