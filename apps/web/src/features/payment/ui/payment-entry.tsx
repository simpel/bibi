import type { PaymentDto } from "@okazi/core/schemas";
import { useFormatter, useTranslations } from "next-intl";
import { PaymentStatusBadge } from "./payment-status-badge";

/** A payment as the server (Date) or a tool result (ISO string) carries it. */
export type PaymentValue = Omit<PaymentDto, "createdAt" | "updatedAt" | "expiresAt" | "paidAt"> & {
  createdAt: Date | string;
  paidAt: Date | string | null;
};

export type PaymentEntryProps = { payment: PaymentValue };

/** One requested payment: method, amount, status, when it was requested or paid, and its link. */
export function PaymentEntry({ payment }: PaymentEntryProps) {
  const t = useTranslations("payment");
  const format = useFormatter();
  const when = new Date(payment.paidAt ?? payment.createdAt);
  return (
    <article data-slot="payment-entry" className="flex flex-wrap items-center gap-2 py-3 text-sm">
      <span className="font-medium">
        {format.number(payment.amountMinor / 100, {
          style: "currency",
          currency: payment.currency,
        })}
      </span>
      <span className="text-muted-foreground">{t(`method.${payment.method}`)}</span>
      <PaymentStatusBadge status={payment.status} />
      <time className="text-xs text-muted-foreground" dateTime={when.toISOString()}>
        {format.dateTime(when, { dateStyle: "medium", timeStyle: "short" })}
      </time>
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
