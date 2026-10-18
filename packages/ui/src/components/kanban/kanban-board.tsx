"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { buildKanbanAnnouncements } from "./kanban-announcements";
import { KanbanCard } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";
import type {
  KanbanCanDrop,
  KanbanCardData,
  KanbanColumnData,
  KanbanLabels,
  KanbanMove,
  KanbanRenderCard,
} from "./kanban-types";

export type KanbanBoardProps<TCard extends KanbanCardData> = {
  columns: readonly KanbanColumnData[];
  cards: readonly TCard[];
  renderCard: KanbanRenderCard<TCard>;
  labels: KanbanLabels;
  /** Decides which columns accept the dragged card. Default: every other column. */
  canDrop?: KanbanCanDrop;
  /** Called after a permitted drop. The caller runs the command and refreshes `cards`. */
  onMove: (move: KanbanMove) => void;
};

/** A board of lanes whose cards move between lanes by drag or keyboard. Order inside a lane is data-driven. */
export function KanbanBoard<TCard extends KanbanCardData>({
  columns,
  cards,
  renderCard,
  labels,
  canDrop = () => true,
  onMove,
}: KanbanBoardProps<TCard>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const active = cards.find((c) => c.id === activeId);

  function accepting({ columnId }: { columnId: string }): boolean | undefined {
    if (!active) return undefined;
    if (active.columnId === columnId) return false;
    return canDrop({ cardId: active.id, fromColumnId: active.columnId, toColumnId: columnId });
  }

  function handleDragEnd({ active: dragged, over }: DragEndEvent) {
    setActiveId(null);
    const card = cards.find((c) => c.id === dragged.id);
    if (!card || !over || accepting({ columnId: String(over.id) }) !== true) return;
    onMove({ cardId: card.id, fromColumnId: card.columnId, toColumnId: String(over.id) });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active: a }: DragStartEvent) => setActiveId(String(a.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: buildKanbanAnnouncements({ cards, columns, labels }),
        screenReaderInstructions: { draggable: labels.dragInstructions },
      }}
    >
      <div data-slot="kanban-board" className="flex h-full snap-x gap-3 overflow-x-auto p-1">
        {columns.map((column) => {
          const inColumn = cards.filter((c) => c.columnId === column.id);
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              count={inColumn.length}
              accepting={accepting({ columnId: column.id })}
              emptyLabel={labels.emptyColumn}
            >
              {inColumn.map((card) => (
                <KanbanCard key={card.id} id={card.id}>
                  {renderCard(card)}
                </KanbanCard>
              ))}
            </KanbanColumn>
          );
        })}
      </div>
      <DragOverlay>
        {active ? (
          <div className="rounded-lg border bg-card p-3 shadow-lg">{renderCard(active)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
