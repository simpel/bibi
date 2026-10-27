import type { DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PaymentEntry, type PaymentValue } from "./payment-entry";

export type PaymentListProps = {
  payments: readonly PaymentValue[];
  /** The viewer's date and time format, from the server or a client card's hook. */
  dates: DateTimeFormat;
  /** The viewer's number format, from the server or a client card's hook. */
  numbers: NumberFormat;
};

/** Requested payments, newest first; shared by the ticket page and the assistant's tool card. */
export function PaymentList({ payments, dates, numbers }: PaymentListProps) {
  const t = useTranslations("payment");
  if (payments.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="payment-list" className="divide-y">
      {payments.map((payment) => (
        <li key={payment.id}>
          <PaymentEntry payment={payment} dates={dates} numbers={numbers} />
        </li>
      ))}
    </ol>
  );
}
