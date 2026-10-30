import type { TicketStatus } from "@bibi/db";
import type { BoardDto } from "../board/schema";
import type { LoadedCard } from "./load-cards";
import type { PipelineBoard, PipelineColumn } from "./schema";

/** The board without `unmappedCount`, which the operation counts in the database. */
export type BoardLayout = Omit<PipelineBoard, "unmappedCount">;

export type BoardColumnsInput = {
  board: BoardDto;
  statuses: readonly TicketStatus[];
  cards: readonly LoadedCard[];
};

const toStatus = ({ row }: { row: TicketStatus }) => ({
  id: row.id,
  title: row.name,
  color: row.color,
  requiresReason: row.requiresReason,
  closed: row.closes,
});

/**
 * The board's phases as columns, each with its statuses as drop zones, and each card placed in
 * the phase of its status (the cards are already limited to the board's statuses).
 */
export function boardColumns({ board, statuses, cards }: BoardColumnsInput): BoardLayout {
  const byId = new Map(statuses.map((row) => [row.id, row]));
  const phaseOf = new Map<string, string>();
  const columns: PipelineColumn[] = board.phases.map((phase) => {
    const rows = phase.statusIds.flatMap((id) => byId.get(id) ?? []);
    for (const row of rows) phaseOf.set(row.id, phase.id);
    return {
      id: phase.id,
      title: phase.name,
      closed: rows.length > 0 && rows.every((row) => row.closes),
      statuses: rows.map((row) => toStatus({ row })),
    };
  });
  const placed = cards.flatMap((card) => {
    const columnId = phaseOf.get(card.statusId);
    return columnId ? [{ ...card, columnId }] : [];
  });
  return { boardId: board.id, boardName: board.name, columns, cards: placed };
}
