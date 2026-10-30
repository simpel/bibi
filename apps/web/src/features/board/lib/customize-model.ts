import type { PipelineBoard, TicketStatusDto } from "@bibi/core/schemas";
import type { KanbanPhaseData, KanbanStatusChipData } from "@bibi/ui";

/** The board's columns for customize mode: each phase with its status ids in status order. */
export function customizePhases({ board }: { board: PipelineBoard }): KanbanPhaseData[] {
  return board.columns.map((column) => ({
    id: column.id,
    title: column.title,
    statusIds: column.statuses.map((status) => status.id),
  }));
}

export type CustomizeChipsInput = {
  board: PipelineBoard;
  statuses: readonly TicketStatusDto[];
};

/**
 * Every active status as a chip. A status on this board shows how many of its tickets the board
 * holds (closing statuses only count recent ones, as the board does); one off the board shows none.
 */
export function customizeChips({ board, statuses }: CustomizeChipsInput): KanbanStatusChipData[] {
  const mapped = new Set(board.columns.flatMap((column) => column.statuses.map((s) => s.id)));
  const counts = new Map<string, number>();
  for (const card of board.cards) counts.set(card.statusId, (counts.get(card.statusId) ?? 0) + 1);
  return statuses.map((status) => ({
    id: status.id,
    title: status.name,
    color: status.color,
    ...(mapped.has(status.id) ? { count: counts.get(status.id) ?? 0 } : {}),
  }));
}

export type MoveInLayoutInput = {
  phases: readonly KanbanPhaseData[];
  statusId: string;
  /** null = off the board. */
  toPhaseId: string | null;
};

/** The layout after moving a status (shown at once, before the saved board comes back). */
export function moveInLayout({
  phases,
  statusId,
  toPhaseId,
}: MoveInLayoutInput): KanbanPhaseData[] {
  return phases.map((phase) => {
    const rest = phase.statusIds.filter((id) => id !== statusId);
    return { ...phase, statusIds: phase.id === toPhaseId ? [...rest, statusId] : rest };
  });
}

/** The layout with its columns in `ids` order. */
export function reorderLayout({
  phases,
  ids,
}: {
  phases: readonly KanbanPhaseData[];
  ids: readonly string[];
}): KanbanPhaseData[] {
  return ids.flatMap((id) => phases.find((phase) => phase.id === id) ?? []);
}
