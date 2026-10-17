export const DATA_TABLE_SELECT_COLUMN_ID = "select";
export const DATA_TABLE_ACTIONS_COLUMN_ID = "actions";

/** Pinned columns sit at the edges and can neither be dragged nor displaced. */
export function isPinnedColumn({ id }: { id: string }): boolean {
  return id === DATA_TABLE_SELECT_COLUMN_ID || id === DATA_TABLE_ACTIONS_COLUMN_ID;
}

export type ResolveColumnOrderInput = {
  /** A previously saved order; may be stale. */
  saved: readonly string[] | undefined;
  /** All current column ids in their default order (the order of the `columns` array). */
  columnIds: readonly string[];
};

type InsertNewColumnInput = { middle: string[]; movable: readonly string[]; id: string };

/** A new column goes right after its default predecessor, or first when it has none yet. */
function insertNewColumn({ middle, movable, id }: InsertNewColumnInput): void {
  for (let index = movable.indexOf(id) - 1; index >= 0; index -= 1) {
    const position = middle.indexOf(movable[index] as string);
    if (position >= 0) {
      middle.splice(position + 1, 0, id);
      return;
    }
  }
  middle.unshift(id);
}

/**
 * Turns a saved order into a valid one for the current columns: drops unknown ids, inserts new
 * columns at their default relative position, and keeps `select` first and `actions` last.
 */
export function resolveColumnOrder({ saved, columnIds }: ResolveColumnOrderInput): string[] {
  const known = new Set(columnIds);
  const movable = columnIds.filter((id) => !isPinnedColumn({ id }));
  const middle: string[] = [];
  for (const id of saved ?? []) {
    if (known.has(id) && !isPinnedColumn({ id }) && !middle.includes(id)) middle.push(id);
  }
  for (const id of movable) {
    if (!middle.includes(id)) insertNewColumn({ middle, movable, id });
  }
  const select = known.has(DATA_TABLE_SELECT_COLUMN_ID) ? [DATA_TABLE_SELECT_COLUMN_ID] : [];
  const actions = known.has(DATA_TABLE_ACTIONS_COLUMN_ID) ? [DATA_TABLE_ACTIONS_COLUMN_ID] : [];
  return [...select, ...middle, ...actions];
}
