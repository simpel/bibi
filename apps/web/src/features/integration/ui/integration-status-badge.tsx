import type { IntegrationStatus } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type IntegrationStatusBadgeProps = { status: IntegrationStatus };

/** Connection state of an outside system; connected is the only state that works. */
export function IntegrationStatusBadge({ status }: IntegrationStatusBadgeProps) {
  const t = useTranslations("integration.status");
  const variant = status === "CONNECTED" ? "secondary" : "outline";
  return <Badge variant={variant}>{t(status)}</Badge>;
}
