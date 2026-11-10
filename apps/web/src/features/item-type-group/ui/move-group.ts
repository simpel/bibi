export type MoveGroupInput = { ids: string[]; id: string; direction: -1 | 1 };

/** The ids in their new order after moving `id` one step; unchanged at either end. */
export function moveGroup({ ids, id, direction }: MoveGroupInput): string[] {
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
