import type { TicketPhaseWarning } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

export type PhaseWarningsProps = { warnings: readonly TicketPhaseWarning[] };

/**
 * Facts that contradict the ticket's phase (ADR 0054), e.g. an accepted quote while the ticket
 * is in an earlier phase. Shown, never resolved by changing either side.
 */
export function PhaseWarnings({ warnings }: PhaseWarningsProps) {
  const t = useTranslations("ticket.phaseHistory.warnings");
  if (warnings.length === 0) return null;
  return (
    <ul
      data-slot="phase-warnings"
      role="status"
      className="grid gap-1 rounded-md border border-warning bg-warning/10 p-3 text-sm"
    >
      {warnings.map((warning) => (
        <li key={warning}>{t(warning)}</li>
      ))}
    </ul>
  );
}
