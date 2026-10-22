import type { PhaseGridCellDto, TicketPhaseDto } from "@bibi/core/schemas";

/** One table row: a phase and the state each item type's cell sets (null = keep). */
export type GridRow = { phase: TicketPhaseDto; cells: Record<string, string | null> };

export type ToGridRowsInput = {
  phases: readonly TicketPhaseDto[];
  typeIds: readonly string[];
  cells: readonly PhaseGridCellDto[];
};

/** Rows in phase order; a cell that is not set is `null`. */
export function toGridRows({ phases, typeIds, cells }: ToGridRowsInput): GridRow[] {
  return phases.map((phase) => ({
    phase,
    cells: Object.fromEntries(
      typeIds.map((typeId) => [
        typeId,
        cells.find((cell) => cell.phaseId === phase.id && cell.entityTypeId === typeId)?.stateId ??
          null,
      ]),
    ),
  }));
}
