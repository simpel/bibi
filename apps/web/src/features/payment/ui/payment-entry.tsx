import type { DateTimeFormat, NumberFormat, PaymentDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PaymentStatusBadge } from "./payment-status-badge";

/** A payment as the server (Date) or a tool result (ISO string) carries it. */
export type PaymentValue = Omit<PaymentDto, "createdAt" | "updatedAt" | "expiresAt" | "paidAt"> & {
  createdAt: Date | string;
  paidAt: Date | string | null;
};

export type PaymentEntryProps = {
  payment: PaymentValue;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
  /** Refund and cancel on the order page; none in the assistant's card. */
  actions?: ReactNode;
};

/** What a payment settles: a quote, a deposit request or an invoice (ADR 0057). */
const settles = ({ payment }: Pick<PaymentEntryProps, "payment">) =>
  payment.depositId ? "DEPOSIT" : payment.invoiceId ? "INVOICE" : "QUOTE";

/**
 * One requested payment: method, amount, what it settles, status, when it was requested or paid,
 * Bibi's application fee on it and its link.
 */
export function PaymentEntry({ payment, dates: format, numbers, actions }: PaymentEntryProps) {
  const t = useTranslations("payment");
  const providers = useTranslations("providers");
  const { money } = numbers;
  const when = new Date(payment.paidAt ?? payment.createdAt);
  const fee = payment.applicationFeeMinor;
  return (
    <article data-slot="payment-entry" className="flex flex-wrap items-center gap-2 py-3 text-sm">
      <span className="font-medium">
        {money({ minor: payment.amountMinor, currency: payment.currency })}
      </span>
      <span className="text-muted-foreground">
        {t(`method.${payment.method}`)} · {t(`for.${settles({ payment })}`)}
      </span>
      <PaymentStatusBadge status={payment.status} />
      {payment.provider ? (
        <span className="text-xs text-muted-foreground">
          {t("via", { name: providers(`${payment.provider}.name`) })}
        </span>
      ) : null}
      <time className="text-xs text-muted-foreground" dateTime={when.toISOString()}>
        {format.dateTime({ instant: when })}
      </time>
      {fee === null ? null : (
        <span className="text-xs text-muted-foreground">
          {t("fee", { amount: money({ minor: fee, currency: payment.currency }) })}
        </span>
      )}
      {payment.refundedMinor > 0 ? (
        <span className="text-xs text-muted-foreground">
          {t("refunded", {
            amount: money({ minor: payment.refundedMinor, currency: payment.currency }),
          })}
        </span>
      ) : null}
      {payment.paymentUrl && payment.status === "PENDING" ? (
        <a
          href={payment.paymentUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-primary hover:underline"
        >
          {t("openLink")}
        </a>
      ) : null}
      {actions ? <div className="ml-auto flex gap-2">{actions}</div> : null}
    </article>
  );
}
