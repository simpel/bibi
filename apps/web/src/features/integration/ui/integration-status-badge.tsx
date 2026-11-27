import type { IntegrationStatus } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";

type ConnectionState = { status: IntegrationStatus; configured: boolean };

export type IntegrationStatusBadgeProps = ConnectionState & {
  /** What the last check found missing at the accounting system; any makes Connected amber. */
  issues?: number;
};

/**
 * False when a connection exists but this server lacks the provider's app keys, so nothing can
 * go through it; a provider that is not connected has nothing to be unusable.
 */
export function isConnectionUsable({ status, configured }: ConnectionState): boolean {
  return configured || status === "NOT_CONNECTED" || status === "DISCONNECTED";
}

/**
 * Connection state of an outside system; connected and usable is the only state that works. A
 * connection with setup issues is amber, with a warning badge beside it counting them.
 */
export function IntegrationStatusBadge({
  status,
  configured,
  issues = 0,
}: IntegrationStatusBadgeProps) {
  const t = useTranslations("integration.status");
  const card = useTranslations("integration.card");
  if (!isConnectionUsable({ status, configured })) {
    return <StatusBadge label={t("UNAVAILABLE")} color="var(--warning)" />;
  }
  const attention = status === "CONNECTED" && issues > 0;
  const color = attention
    ? "var(--warning)"
    : status === "CONNECTED"
      ? "var(--success)"
      : "var(--muted-foreground)";
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <StatusBadge label={t(status)} color={color} />
      {attention ? (
        <StatusBadge tinted label={card("attention", { count: issues })} color="var(--warning)" />
      ) : null}
    </span>
  );
}
