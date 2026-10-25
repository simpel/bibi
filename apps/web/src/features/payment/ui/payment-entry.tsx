import type { PaymentDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { PaymentStatusBadge } from "./payment-status-badge";

/** A payment as the server (Date) or a tool result (ISO string) carries it. */
export type PaymentValue = Omit<PaymentDto, "createdAt" | "updatedAt" | "expiresAt" | "paidAt"> & {
  createdAt: Date | string;
  paidAt: Date | string | null;
};

export type PaymentEntryProps = { payment: PaymentValue };

/** What a payment settles: a quote, a deposit request or an invoice (ADR 0057). */
const settles = ({ payment }: PaymentEntryProps) =>
  payment.depositId ? "DEPOSIT" : payment.invoiceId ? "INVOICE" : "QUOTE";

/**
 * One requested payment: method, amount, what it settles, status, when it was requested or paid,
 * Bibi's application fee on it and its link.
 */
export function PaymentEntry({ payment }: PaymentEntryProps) {
  const t = useTranslations("payment");
  const format = useDateTimeFormat();
  const { money } = useNumberFormat();
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
      <time className="text-xs text-muted-foreground" dateTime={when.toISOString()}>
        {format.dateTime({ instant: when })}
      </time>
      {fee === null ? null : (
        <span className="text-xs text-muted-foreground">
          {t("fee", { amount: money({ minor: fee, currency: payment.currency }) })}
        </span>
      )}
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
    </article>
  );
}
