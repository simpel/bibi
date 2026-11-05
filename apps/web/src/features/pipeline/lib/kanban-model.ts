import type { PipelineBoard, PipelineCard, PipelineStatus } from "@bibi/core";
import type { KanbanColumnData, KanbanMove } from "@bibi/ui";
import { dropTargets } from "./move-rules";

/** A board card as the kanban shows it. */
export type BoardCard = Omit<PipelineCard, "title"> & {
  /** The order's title; an untitled order goes by its customer, else its reference. */
  title: string;
  /** Null when the caller may not view customers (ADR 0050): then none is shown. */
  customerName: string | null;
  /** The status name, set only in a column that groups several statuses. */
  statusTitle: string | null;
};

/** The board's phases as kanban columns; a drop on one picks its status (ADR 0076). */
export function kanbanColumns({ board }: { board: PipelineBoard }): KanbanColumnData[] {
  return board.columns.map((column) => ({ id: column.id, title: column.title }));
}

export type KanbanCardsInput = {
  board: PipelineBoard;
  customerNames: Readonly<Record<string, string>>;
};

/** The cards, titled by the order's title (else customer or reference) in their status zone. */
export function kanbanCards({ board, customerNames }: KanbanCardsInput): BoardCard[] {
  return board.cards.map((card) => {
    const column = board.columns.find((c) => c.id === card.columnId);
    const status = column?.statuses.find((s) => s.id === card.statusId);
    const customerName = customerNames[card.customerId] ?? null;
    return {
      ...card,
      title: card.title ?? customerName ?? `#${card.reference}`,
      customerName,
      statusTitle: column && column.statuses.length > 1 ? (status?.title ?? null) : null,
    };
  });
}

export type FoundDrop = {
  card: PipelineCard;
  from: PipelineStatus;
  /** The statuses of the drop column; the ones the card may move to are `targets`. */
  column: PipelineBoard["columns"][number];
  targets: PipelineStatus[];
};

export type FindDropInput = {
  board: PipelineBoard;
  move: KanbanMove;
  transitions: Readonly<Record<string, readonly string[]>>;
};

/** A kanban move → the card, its status, the drop column and the statuses it may move to there. */
export function findDrop({ board, move, transitions }: FindDropInput): FoundDrop | null {
  const card = board.cards.find((c) => c.id === move.cardId);
  const statuses = board.columns.flatMap((column) => column.statuses);
  const from = statuses.find((status) => status.id === card?.statusId);
  const column = board.columns.find((c) => c.id === move.toColumnId);
  if (!card || !from || !column) return null;
  const targets = dropTargets({ card, from, statuses: column.statuses, transitions });
  return { card, from, column, targets };
}
