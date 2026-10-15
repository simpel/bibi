import type { PaymentStatus } from "@okazi/core/schemas";
import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type PaymentStatusBadgeProps = { status: PaymentStatus };

/** Where a requested payment stands; only a paid one is highlighted. */
export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const t = useTranslations("payment.status");
  const variant = status === "SUCCEEDED" ? "secondary" : "outline";
  return <Badge variant={variant}>{t(status)}</Badge>;
}
