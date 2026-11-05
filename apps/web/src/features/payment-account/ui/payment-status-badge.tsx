import type { PaymentAccountDto } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type PaymentStatusBadgeProps = { status: PaymentAccountDto["status"] };

/** Connection state of the payout account; active is the only state that can be paid. */
export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const t = useTranslations("paymentAccount.status");
  const color = status === "ACTIVE" ? "var(--success)" : "var(--muted-foreground)";
  return <StatusBadge label={t(status)} color={color} />;
}
