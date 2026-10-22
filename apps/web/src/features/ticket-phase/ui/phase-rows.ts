import type { TicketPhaseDto } from "@bibi/core/schemas";
import { PHASE_FLAGS, type PhaseFlag } from "@bibi/core/schemas";

/** One table row: a phase with the names it may move to and the flags it has. */
export type PhaseRow = {
  phase: TicketPhaseDto;
  index: number;
  targets: string[];
  flags: PhaseFlag[];
};

export type ToPhaseRowsInput = { phases: readonly TicketPhaseDto[] };

/** Rows in board order; unknown transition targets fall back to the id. */
export function toPhaseRows({ phases }: ToPhaseRowsInput): PhaseRow[] {
  return phases.map((phase, index) => ({
    phase,
    index,
    targets: phase.transitionsTo.map((id) => phases.find((target) => target.id === id)?.name ?? id),
    flags: PHASE_FLAGS.filter((flag) => phase[flag]),
  }));
}
