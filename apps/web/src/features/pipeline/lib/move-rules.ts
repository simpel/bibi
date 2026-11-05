import type { PipelineCard, PipelineStatus } from "@bibi/core";

export type MoveRuleInput = {
  card: PipelineCard;
  /** The card's current status. */
  from: PipelineStatus;
  /** The status it moves to. */
  to: PipelineStatus;
  /** The organization's order status transitions: status id → ids it may move to. */
  transitions: Readonly<Record<string, readonly string[]>>;
};

/**
 * Whether a card may move from one status to another (ADR 0041, 0043, 0067, 0076): a move the
 * organization allows out of an open status, also within the same column (a column groups
 * statuses). A REASON gate opens a dialog that asks for it; core checks every other gate and
 * refuses with the blockers, which a dialog lists.
 */
export function canMoveCard({ card, from, to, transitions }: MoveRuleInput): boolean {
  if (from.closed || from.id === to.id || card.statusId !== from.id) return false;
  return transitions[from.id]?.includes(to.id) ?? false;
}

export type DropTargetsInput = {
  card: PipelineCard;
  /** The card's current status. */
  from: PipelineStatus;
  /** The statuses of the column the card is dropped on. */
  statuses: readonly PipelineStatus[];
  transitions: MoveRuleInput["transitions"];
};

/**
 * The statuses of the drop column the card may move to (ADR 0076): the organization's allowed
 * targets of its current status, never the current status itself. Several mean a picker.
 */
export function dropTargets({ card, from, statuses, transitions }: DropTargetsInput) {
  return statuses.filter((to) => canMoveCard({ card, from, to, transitions }));
}
