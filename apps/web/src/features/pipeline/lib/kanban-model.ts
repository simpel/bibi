import type { PipelineBoard, PipelineCard, PipelineStatus, PipelineTaskCard } from "@bibi/core";
import type { KanbanColumnData, KanbanMove } from "@bibi/ui";
import { dropTargets, type MoveSubject, taskDropTargets } from "./move-rules";

/** A board card as the kanban shows it. */
export type BoardCard = Omit<PipelineCard, "title"> & {
  /** The order's title; an untitled order goes by its customer, else its reference. */
  title: string;
  /** Null when the caller may not view customers (ADR 0050): then none is shown. */
  customerName: string | null;
  /** The status name, set only in a column that groups several statuses. */
  statusTitle: string | null;
  /** The status name, always; the pinned card shows it as its state. */
  statusName: string;
  /** The status colour, for its badge beside `statusTitle`. */
  statusColor: string | null;
  /** The main assignee's name, for the avatar; null without one. */
  assigneeName: string | null;
  /** ISO 4217 code of the card's value (the board's currency). */
  currency: string;
};

/** The board's phases as kanban columns; a drop on one picks its status (ADR 0076). */
export function kanbanColumns({ board }: { board: PipelineBoard }): KanbanColumnData[] {
  return board.columns.map((column) => ({ id: column.id, title: column.title }));
}

export type KanbanCardsInput = {
  board: PipelineBoard;
  customerNames: Readonly<Record<string, string>>;
  /** Member user id → name; empty hides the assignee. */
  memberNames?: Readonly<Record<string, string>>;
};

/** The cards, titled by the order's title (else customer or reference) in their status zone. */
export function kanbanCards({
  board,
  customerNames,
  memberNames = {},
}: KanbanCardsInput): BoardCard[] {
  return board.cards.map((card) => {
    const column = board.columns.find((c) => c.id === card.columnId);
    const status = column?.statuses.find((s) => s.id === card.statusId);
    const customerName = customerNames[card.customerId] ?? null;
    return {
      ...card,
      title: card.title ?? customerName ?? `#${card.reference}`,
      customerName,
      statusTitle: column && column.statuses.length > 1 ? (status?.title ?? null) : null,
      statusName: status?.title ?? "",
      statusColor: status?.color ?? null,
      assigneeName: card.assigneeId ? (memberNames[card.assigneeId] ?? null) : null,
      currency: board.currency,
    };
  });
}

/** A task card as the kanban shows it (ADR 0121): in its phase after the orders. */
export type TaskBoardCard = PipelineTaskCard & {
  /** The task type's name, for screen readers. */
  title: string;
  /** Null without a customer, or when the caller may not view customers (ADR 0050). */
  customerName: string | null;
  /** The main assignee's name, for the avatar; null without one. */
  assigneeName: string | null;
};

/** Everything the board draws: order cards, then task cards. */
export type BoardItem = BoardCard | TaskBoardCard;

/** Only the order cards: the totals and sums count orders, never tasks. */
export const orderItems = ({ items }: { items: readonly BoardItem[] }): BoardCard[] =>
  items.filter((item): item is BoardCard => item.kind === "order");

/** The task cards, after the orders in their phase (the board lists them by due time). */
export function kanbanTaskCards({
  board,
  customerNames,
  memberNames = {},
}: KanbanCardsInput): TaskBoardCard[] {
  return board.taskCards.map((card) => ({
    ...card,
    title: card.typeName,
    customerName: card.customerId ? (customerNames[card.customerId] ?? null) : null,
    assigneeName: card.assigneeId ? (memberNames[card.assigneeId] ?? null) : null,
  }));
}

export type FoundDrop = {
  subject: MoveSubject;
  /** The statuses of the drop column; the ones the card may move to are `targets`. */
  column: PipelineBoard["columns"][number];
  targets: PipelineStatus[];
};

export type FindDropInput = {
  board: PipelineBoard;
  move: KanbanMove;
  transitions: Readonly<Record<string, readonly string[]>>;
};

/** A kanban move → what moved, the drop column and the statuses it may move to there. */
export function findDrop({ board, move, transitions }: FindDropInput): FoundDrop | null {
  const column = board.columns.find((c) => c.id === move.toColumnId);
  if (!column) return null;
  const task = board.taskCards.find((c) => c.id === move.cardId);
  if (task) {
    const targets = taskDropTargets({ card: task, statuses: column.statuses });
    return { subject: { kind: "task", card: task }, column, targets };
  }
  const card = board.cards.find((c) => c.id === move.cardId);
  const statuses = board.columns.flatMap((c) => c.statuses);
  const from = statuses.find((status) => status.id === card?.statusId);
  if (!card || !from) return null;
  const targets = dropTargets({ card, from, statuses: column.statuses, transitions });
  return { subject: { kind: "order", card }, column, targets };
}
