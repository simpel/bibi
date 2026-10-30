import type { KanbanCardData, KanbanColumnData } from "./kanban-types";

/** Where a card can land: a column, or one zone of a column. */
export type KanbanTarget = { columnId: string; zoneId?: string };

const ZONE = "kanban-zone:";

/** The droppable id of one zone; distinct from column ids. */
export function zoneDropId({ zoneId }: { zoneId: string }): string {
  return `${ZONE}${zoneId}`;
}

export type ResolveTargetInput = { id: string; columns: readonly KanbanColumnData[] };

/**
 * A droppable id → the column (and zone) it stands for. A column with a single zone drops into
 * that zone; `null` for an unknown id.
 */
export function resolveTarget({ id, columns }: ResolveTargetInput): KanbanTarget | null {
  if (id.startsWith(ZONE)) {
    const zoneId = id.slice(ZONE.length);
    const column = columns.find((c) => c.zones?.some((zone) => zone.id === zoneId));
    return column ? { columnId: column.id, zoneId } : null;
  }
  const column = columns.find((c) => c.id === id);
  if (!column) return null;
  const only = column.zones?.length === 1 ? column.zones[0] : undefined;
  return only ? { columnId: column.id, zoneId: only.id } : { columnId: column.id };
}

/** "Column" or "Column › Zone", for announcements. */
export function targetTitle({ id, columns }: ResolveTargetInput): string {
  const target = resolveTarget({ id, columns });
  const column = columns.find((c) => c.id === target?.columnId);
  if (!column) return "";
  const zone = column.zones?.find((z) => z.id === target?.zoneId);
  return zone && (column.zones?.length ?? 0) > 1 ? `${column.title} › ${zone.title}` : column.title;
}

/** True when the card already sits on the target (no move). */
export function isSameTarget({
  card,
  target,
}: {
  card: KanbanCardData;
  target: KanbanTarget;
}): boolean {
  if (card.columnId !== target.columnId) return false;
  return target.zoneId === undefined || card.zoneId === undefined || card.zoneId === target.zoneId;
}

/** Whether a column shows separate zones while a card is dragged. */
export function hasZones({ column }: { column: KanbanColumnData }): boolean {
  return (column.zones?.length ?? 0) > 1;
}
