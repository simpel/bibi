import type { DateTimeFormat, DepositDto, InvoiceDto, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { CreditInvoiceButton } from "./credit-invoice-button";
import { DepositEntry } from "./deposit-entry";
import { InvoiceEntry } from "./invoice-entry";
import { InvoiceLines } from "./invoice-lines";
import { ReceivableActions } from "./receivable-actions";
import { SyncInvoiceButton } from "./sync-invoice-button";

/** The viewer's formats, from the server (`getDateTimeFormat`, `getNumberFormat`). */
type Formats = { dates: DateTimeFormat; numbers: NumberFormat };

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
  const providers = useTranslations("providers");
  const { id, status, openMinor, canVoid } = invoice;
  const confirm = t("voidConfirm", { number: invoice.documentNumber ?? "–" });
  const actions = canWrite ? (
    <>
      {invoice.canSync && invoice.provider ? (
        <SyncInvoiceButton id={id} name={providers(`${invoice.provider}.name`)} />
      ) : null}
      {invoice.canCredit ? <CreditInvoiceButton invoice={invoice} /> : null}
      <ReceivableActions
        {...{ kind: "invoice", id, status, openMinor, canVoid }}
        voidConfirm={confirm}
      />
    </>
  ) : null;
  return (
    <li>
      <InvoiceEntry invoice={invoice} actions={actions} {...formats} />
      <InvoiceLines invoice={invoice} />
    </li>
  );
}

export type ReceivableListProps = {
  deposits: readonly DepositDto[];
  invoices: readonly InvoiceDto[];
  canWrite: boolean;
} & Formats;

/**
 * What the customer pays for (ADR 0057): deposit requests and invoices. A quote is listed only
 * under Quotes; what is billed from it shows in the balance.
 */
export function ReceivableList(props: ReceivableListProps) {
  const { deposits, invoices, canWrite, dates, numbers } = props;
  const formats = { dates, numbers };
  return (
    <ol data-slot="receivable-list" className="divide-y">
      {deposits.map((deposit) => (
        <DepositRow key={deposit.id} deposit={deposit} canWrite={canWrite} {...formats} />
      ))}
      {invoices.map((invoice) => (
        <InvoiceRow key={invoice.id} invoice={invoice} canWrite={canWrite} {...formats} />
      ))}
    </ol>
  );
}
