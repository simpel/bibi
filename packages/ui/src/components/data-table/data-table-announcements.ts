import type { Announcements } from "@dnd-kit/core";
import type { DataTableTextLabels } from "./data-table-types";

export type BuildAnnouncementsInput = {
  /** Draggable column ids in their current order. */
  movable: readonly string[];
  titles: Readonly<Record<string, string>>;
  labels: DataTableTextLabels;
};

/** Screen reader announcements for dragging a column header. */
export function buildAnnouncements({
  movable,
  titles,
  labels,
}: BuildAnnouncementsInput): Announcements {
  const titleOf = ({ id }: { id: string | number }) => titles[String(id)] ?? String(id);
  const positionOf = ({ id }: { id: string | number }) => movable.indexOf(String(id)) + 1;
  return {
    onDragStart: ({ active }) => labels.columnPickedUp(titleOf({ id: active.id })),
    onDragOver: ({ active, over }) =>
      over
        ? labels.columnMoved(
            titleOf({ id: active.id }),
            positionOf({ id: over.id }),
            movable.length,
          )
        : undefined,
    onDragEnd: ({ active, over }) =>
      labels.columnDropped(
        titleOf({ id: active.id }),
        positionOf({ id: over?.id ?? active.id }),
        movable.length,
      ),
    onDragCancel: () => undefined,
  };
}
