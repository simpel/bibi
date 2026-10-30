import type { Announcements } from "@dnd-kit/core";
import { targetTitle } from "./kanban-targets";
import type { KanbanCardData, KanbanColumnData, KanbanLabels } from "./kanban-types";

export type BuildKanbanAnnouncementsInput = {
  cards: readonly KanbanCardData[];
  columns: readonly KanbanColumnData[];
  labels: KanbanLabels;
};

/** Screen reader announcements for dragging a card between columns (and their zones). */
export function buildKanbanAnnouncements({
  cards,
  columns,
  labels,
}: BuildKanbanAnnouncementsInput): Announcements {
  const cardTitle = ({ id }: { id: string | number }) =>
    cards.find((c) => c.id === id)?.title ?? String(id);
  const columnTitle = ({ id }: { id: string | number }) => targetTitle({ id: String(id), columns });
  return {
    onDragStart: ({ active }) => labels.pickedUp(cardTitle({ id: active.id })),
    onDragOver: ({ active, over }) =>
      over
        ? labels.movedOver(cardTitle({ id: active.id }), columnTitle({ id: over.id }))
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? labels.dropped(cardTitle({ id: active.id }), columnTitle({ id: over.id }))
        : labels.cancelled(cardTitle({ id: active.id })),
    onDragCancel: ({ active }) => labels.cancelled(cardTitle({ id: active.id })),
  };
}
