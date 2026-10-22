import type { TicketPhaseDto } from "@bibi/core/schemas";
import { ColorSwatch } from "@bibi/ui";

export type TicketPhaseLabelProps = { phases: readonly TicketPhaseDto[]; id: string };

/** The ticket's phase name with its color ("–" for a phase that is no longer listed). */
export function TicketPhaseLabel({ phases, id }: TicketPhaseLabelProps) {
  const phase = phases.find((candidate) => candidate.id === id);
  if (!phase) return <>–</>;
  return (
    <span className="inline-flex items-center gap-2">
      <ColorSwatch color={phase.color} />
      {phase.name}
    </span>
  );
}
