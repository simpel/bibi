import type { PaymentStatus } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type PaymentStatusBadgeProps = { status: PaymentStatus };

/** Where a requested payment stands; only a paid one is highlighted. */
export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const t = useTranslations("payment.status");
  const color = status === "SUCCEEDED" ? "var(--success)" : "var(--muted-foreground)";
  return <StatusBadge label={t(status)} color={color} />;
}
