import type { TicketStatusWarning } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

export type StatusWarningsProps = { warnings: readonly TicketStatusWarning[] };

/**
 * Facts that contradict the ticket's status (ADR 0054), e.g. an accepted quote while the ticket
 * is in an earlier status. Shown, never resolved by changing either side.
 */
export function StatusWarnings({ warnings }: StatusWarningsProps) {
  const t = useTranslations("ticket.statusHistory.warnings");
  if (warnings.length === 0) return null;
  return (
    <ul
      data-slot="status-warnings"
      role="status"
      className="grid gap-1 rounded-md border border-warning bg-warning/10 p-3 text-sm"
    >
      {warnings.map((warning) => (
        <li key={warning}>{t(warning)}</li>
      ))}
    </ul>
  );
}
