import type { IntegrationStatus } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";

type ConnectionState = { status: IntegrationStatus; configured: boolean };

/**
 * False when a connection exists but this server lacks the provider's app keys, so nothing can
 * go through it; a provider that is not connected has nothing to be unusable.
 */
export function isConnectionUsable({ status, configured }: ConnectionState): boolean {
  return configured || status === "NOT_CONNECTED" || status === "DISCONNECTED";
}

export type IntegrationStatusBadgeProps = ConnectionState;

/** Connection state of an outside system; connected and usable is the only state that works. */
export function IntegrationStatusBadge({ status, configured }: IntegrationStatusBadgeProps) {
  const t = useTranslations("integration.status");
  if (!isConnectionUsable({ status, configured })) {
    return <StatusBadge label={t("UNAVAILABLE")} color="var(--warning)" />;
  }
  const color = status === "CONNECTED" ? "var(--success)" : "var(--muted-foreground)";
  return <StatusBadge label={t(status)} color={color} />;
}
