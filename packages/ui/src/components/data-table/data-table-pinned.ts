import { DATA_TABLE_ACTIONS_COLUMN_ID } from "./data-table-order";

/**
 * The actions column sticks to the right edge of the visible area when the table scrolls
 * sideways. Its cell is opaque so columns pass under it; row hover and selection are painted as a
 * layer over the card colour so the cell matches the rest of its row.
 */
const STICKY_ACTIONS_CELL =
  "sticky right-0 z-[1] bg-card shadow-[inset_1px_0_0_var(--color-border)] [tr:hover>&]:bg-linear-to-r [tr:hover>&]:from-muted/50 [tr:hover>&]:to-muted/50 [tr[data-state=selected]>&]:bg-muted";

/** The extra classes of a cell in a pinned column, or `undefined` for every other column. */
export function pinnedCellClass({ id }: { id: string }): string | undefined {
  return id === DATA_TABLE_ACTIONS_COLUMN_ID ? STICKY_ACTIONS_CELL : undefined;
}
