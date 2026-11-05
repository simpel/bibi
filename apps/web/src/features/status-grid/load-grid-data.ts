import "server-only";
import { getStatusGrid, listOrderStatuses, type Result } from "@bibi/core";
import type { StatusGridCellDto, OrderStatusDto } from "@bibi/core/schemas";
import { loadItemStateData, type TypeStates } from "@/features/item-state/load-item-state-data";
import { runOperation } from "@/server/run-operation";

export type GridData = {
  statuses: OrderStatusDto[];
  types: TypeStates[];
  cells: StatusGridCellDto[];
};

const LIMIT = 100;

/** Statuses down, item types (with their states) across, and the cells that are set. */
export async function loadGridData(): Promise<Result<GridData>> {
  const [statuses, types, grid] = await Promise.all([
    runOperation({ operation: listOrderStatuses, input: { limit: LIMIT } }),
    loadItemStateData(),
    runOperation({ operation: getStatusGrid, input: {} }),
  ]);
  if (!statuses.ok) return statuses;
  if (!types.ok) return types;
  if (!grid.ok) return grid;
  return {
    ok: true,
    value: { statuses: statuses.value.items, types: types.value, cells: grid.value.cells },
  };
}
