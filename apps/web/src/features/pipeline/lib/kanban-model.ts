import type { PipelineBoard, PipelineCard, PipelineStatus } from "@bibi/core";
import type { KanbanColumnData, KanbanMove } from "@bibi/ui";
import { dropStatus } from "./move-rules";

/** A board card as the kanban shows it. */
export type BoardCard = PipelineCard & {
  zoneId: string;
  title: string;
  /** Null when the caller may not view customers (ADR 0050): then none is shown. */
  customerName: string | null;
  /** The status name, set only in a column that groups several statuses. */
  statusTitle: string | null;
};

/** The board's phases as kanban columns, each status a drop zone (ADR 0067). */
export function kanbanColumns({ board }: { board: PipelineBoard }): KanbanColumnData[] {
  return board.columns.map((column) => ({
    id: column.id,
    title: column.title,
    zones: column.statuses.map(({ id, title, color }) => ({ id, title, color })),
  }));
}

export type KanbanCardsInput = {
  board: PipelineBoard;
  customerNames: Readonly<Record<string, string>>;
};

/** The cards, titled by customer (or reference) and placed in their status zone. */
export function kanbanCards({ board, customerNames }: KanbanCardsInput): BoardCard[] {
  return board.cards.map((card) => {
    const column = board.columns.find((c) => c.id === card.columnId);
    const status = column?.statuses.find((s) => s.id === card.statusId);
    const customerName = customerNames[card.customerId] ?? null;
    return {
      ...card,
      zoneId: card.statusId,
      title: customerName ?? `#${card.reference}`,
      customerName,
      statusTitle: column && column.statuses.length > 1 ? (status?.title ?? null) : null,
    };
  });
}

export type FoundDrop = { card: PipelineCard; from: PipelineStatus; to: PipelineStatus };

/** A kanban move → the card, its current status and the status it is dropped on. */
export function findDrop({ board, move }: { board: PipelineBoard; move: KanbanMove }) {
  const card = board.cards.find((c) => c.id === move.cardId);
  const statuses = board.columns.flatMap((column) => column.statuses);
  const from = statuses.find((status) => status.id === card?.statusId);
  const to = dropStatus({
    columns: board.columns,
    columnId: move.toColumnId,
    zoneId: move.toZoneId,
  });
  return card && from && to ? { card, from, to } : null;
}
