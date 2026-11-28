import type { PipelineCard, PipelineStatus, PipelineTaskCard } from "@bibi/core";
import type { TransitionGate } from "@bibi/core/schemas";

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

/** What a drop moves: an order (`order.changeStatus`) or a task (`task.move`, ADR 0121). */
export type MoveSubject =
  | { kind: "order"; card: PipelineCard }
  | { kind: "task"; card: PipelineTaskCard };

export type TaskDropTargetsInput = {
  card: Pick<PipelineTaskCard, "statusId" | "allowedStatusIds">;
  /** The statuses of the column the card is dropped on. */
  statuses: readonly PipelineStatus[];
};

/**
 * The statuses of the drop column a task card may move to (ADR 0121): those the server lists in
 * `allowedStatusIds` (it computes them with the rule `task.move` checks), never its own status.
 * One moves at once, several open the picker, none refuses the drop.
 */
export function taskDropTargets({ card, statuses }: TaskDropTargetsInput) {
  return statuses.filter((to) => to.id !== card.statusId && card.allowedStatusIds.includes(to.id));
}

export type PickGatesInput = {
  subject: MoveSubject;
  /** Status id → target id → the gates of that move; gate-free moves are absent. */
  moveGates: Readonly<Record<string, Readonly<Record<string, readonly TransitionGate[]>>>>;
};

/**
 * The requirements the picker lists per target. A task meets only the assignee gate: the others
 * read order data (a reason, a quote) and are skipped for it (ADR 0121).
 */
export function pickGates({ subject, moveGates }: PickGatesInput) {
  const gates = moveGates[subject.card.statusId] ?? {};
  if (subject.kind === "order") return gates;
  return Object.fromEntries(
    Object.entries(gates).map(([id, list]) => [id, list.filter((gate) => gate === "ASSIGNEE")]),
  );
}
