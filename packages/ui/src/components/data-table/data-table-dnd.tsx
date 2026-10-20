import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { type ReactNode, useId } from "react";
import { buildAnnouncements } from "./data-table-announcements";
import { isPinnedColumn, resolveColumnOrder } from "./data-table-order";
import { restrictToMovableColumns } from "./data-table-restrict-modifier";
import type { DataTableTextLabels } from "./data-table-types";

export type DataTableDndProps = {
  /** The full column order, pinned columns included. */
  order: string[];
  titles: Readonly<Record<string, string>>;
  labels: DataTableTextLabels;
  onOrderChange: (order: string[]) => void;
  children: ReactNode;
};

/** Pointer (after 5 px, so clicks still sort) and keyboard dragging of column headers. */
function useColumnSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

/** Drag and drop context for column headers. Render it outside the `<table>` element. */
export function DataTableDnd({
  order,
  titles,
  labels,
  onOrderChange,
  children,
}: DataTableDndProps) {
  const sensors = useColumnSensors();
  const movable = order.filter((id) => !isPinnedColumn({ id }));
  // A stable id: dnd-kit's own counter differs between server and client (hydration mismatch).
  const dndId = useId();

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      movable,
      movable.indexOf(String(active.id)),
      movable.indexOf(String(over.id)),
    );
    onOrderChange(resolveColumnOrder({ saved: next, columnIds: order }));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis, restrictToMovableColumns]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: buildAnnouncements({ movable, titles, labels }),
        screenReaderInstructions: { draggable: labels.dragInstructions },
      }}
    >
      <SortableContext items={movable} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
