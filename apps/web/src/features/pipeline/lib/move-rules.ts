import type { PipelineCard, PipelineStatus } from "@bibi/core";

export type MoveRuleInput = {
  card: PipelineCard;
  /** The card's current status. */
  from: PipelineStatus;
  /** The status drop zone it is dragged onto. */
  to: PipelineStatus;
  /** The organization's ticket status transitions: status id → ids it may move to. */
  transitions: Readonly<Record<string, readonly string[]>>;
};

/**
 * Which drops the board accepts (ADR 0041, 0043, 0067): a move the organization allows out of an
 * open status into another status, also within the same column (a column groups statuses). A
 * REASON gate on the transition opens a dialog that asks for it; core checks every other gate and
 * refuses with the blockers, which a dialog lists.
 */
export function canMoveCard({ card, from, to, transitions }: MoveRuleInput): boolean {
  if (from.closed || from.id === to.id || card.statusId !== from.id) return false;
  return transitions[from.id]?.includes(to.id) ?? false;
}

export type DropStatusInput = {
  /** The board's columns with their statuses. */
  columns: readonly { id: string; statuses: readonly PipelineStatus[] }[];
  columnId: string;
  /** The zone (status id) the card was dropped on, when the kanban reports one. */
  zoneId?: string | undefined;
};

/** The status a drop lands in: the zone's, or a single-status column's only status. */
export function dropStatus({ columns, columnId, zoneId }: DropStatusInput): PipelineStatus | null {
  const statuses = columns.find((column) => column.id === columnId)?.statuses ?? [];
  if (zoneId !== undefined) return statuses.find((status) => status.id === zoneId) ?? null;
  return statuses.length === 1 ? (statuses[0] ?? null) : null;
}
