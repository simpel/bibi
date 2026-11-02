/** Anything that may sit under a parent: a line, an order line's source, a work order row. */
export type NestableRow = { id: string; parentId: string | null };

export type NestUnderParentsInput<T> = {
  rows: readonly T[];
  /** The row's own key and its parent's key (null on a top-level row). */
  keys: (row: T) => NestableRow;
};

/**
 * The rows in their given order, except that each sub-line follows its parent right away (in its
 * own order), so a document shows it indented under that parent (ADR 0059, 0088). A sub-line
 * whose parent is not among the rows keeps its own place.
 */
export function nestUnderParents<T>({ rows, keys }: NestUnderParentsInput<T>): T[] {
  const present = new Set(rows.map((row) => keys(row).id));
  const children = new Map<string, T[]>();
  for (const row of rows) {
    const { parentId } = keys(row);
    if (parentId && present.has(parentId)) {
      children.set(parentId, [...(children.get(parentId) ?? []), row]);
    }
  }
  return rows.flatMap((row) => {
    const { id, parentId } = keys(row);
    if (parentId && present.has(parentId)) return [];
    return [row, ...(children.get(id) ?? [])];
  });
}
