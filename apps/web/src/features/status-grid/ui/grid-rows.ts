import type { OrderStatusDto, StatusGridCellDto } from "@bibi/core/schemas";

/** One table row: a status and the state each item type's cell sets (null = keep). */
export type GridRow = { orderStatus: OrderStatusDto; cells: Record<string, string | null> };

export type ToGridRowsInput = {
  statuses: readonly OrderStatusDto[];
  typeIds: readonly string[];
  cells: readonly StatusGridCellDto[];
};

/** Rows in status order; a cell that is not set is `null`. */
export function toGridRows({ statuses, typeIds, cells }: ToGridRowsInput): GridRow[] {
  return statuses.map((orderStatus) => ({
    orderStatus,
    cells: Object.fromEntries(
      typeIds.map((typeId) => [
        typeId,
        cells.find((cell) => cell.statusId === orderStatus.id && cell.entityTypeId === typeId)
          ?.stateId ?? null,
      ]),
    ),
  }));
}
