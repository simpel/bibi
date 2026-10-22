import "server-only";
import { getPhaseGrid, listTicketPhases, type Result } from "@bibi/core";
import type { PhaseGridCellDto, TicketPhaseDto } from "@bibi/core/schemas";
import { loadItemStateData, type TypeStates } from "@/features/item-state/load-item-state-data";
import { runOperation } from "@/server/run-operation";

export type GridData = {
  phases: TicketPhaseDto[];
  types: TypeStates[];
  cells: PhaseGridCellDto[];
};

const LIMIT = 100;

/** Phases down, item types (with their states) across, and the cells that are set. */
export async function loadGridData(): Promise<Result<GridData>> {
  const [phases, types, grid] = await Promise.all([
    runOperation({ operation: listTicketPhases, input: { limit: LIMIT } }),
    loadItemStateData(),
    runOperation({ operation: getPhaseGrid, input: {} }),
  ]);
  if (!phases.ok) return phases;
  if (!types.ok) return types;
  if (!grid.ok) return grid;
  return {
    ok: true,
    value: { phases: phases.value.items, types: types.value, cells: grid.value.cells },
  };
}
