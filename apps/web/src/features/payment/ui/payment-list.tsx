import { useTranslations } from "next-intl";
import { PaymentEntry, type PaymentValue } from "./payment-entry";

export type PaymentListProps = { payments: readonly PaymentValue[] };

/** Requested payments, newest first; shared by the booking page and the assistant's tool card. */
export function PaymentList({ payments }: PaymentListProps) {
  const t = useTranslations("payment");
  if (payments.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="payment-list" className="divide-y">
      {payments.map((payment) => (
        <li key={payment.id}>
          <PaymentEntry payment={payment} />
        </li>
      ))}
    </ol>
  );
}
