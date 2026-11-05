import type { IntegrationStatus } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type IntegrationStatusBadgeProps = { status: IntegrationStatus };

/** Connection state of an outside system; connected is the only state that works. */
export function IntegrationStatusBadge({ status }: IntegrationStatusBadgeProps) {
  const t = useTranslations("integration.status");
  const color = status === "CONNECTED" ? "var(--success)" : "var(--muted-foreground)";
  return <StatusBadge label={t(status)} color={color} />;
}
