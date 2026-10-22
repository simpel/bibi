import type { PaymentAccountDto } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type PaymentStatusBadgeProps = { status: PaymentAccountDto["status"] };

/** Connection state of the payout account; active is the only state that can be paid. */
export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const t = useTranslations("paymentAccount.status");
  const variant = status === "ACTIVE" ? "secondary" : "outline";
  return <Badge variant={variant}>{t(status)}</Badge>;
}
