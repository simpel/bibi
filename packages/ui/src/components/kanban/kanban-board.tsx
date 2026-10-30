"use client";

import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
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
import { type KanbanColumnDropState, useKanbanDrop } from "./use-kanban-drop";

import { useKanbanSensors } from "./use-kanban-sensors";

export type KanbanBoardProps<TCard extends KanbanCardData> = {
  columns: readonly KanbanColumnData[];
  cards: readonly TCard[];
  renderCard: KanbanRenderCard<TCard>;
  labels: KanbanLabels;
  /** Decides which columns (and zones) accept the dragged card. Default: every other one. */
  canDrop?: KanbanCanDrop;
  /** Called after a permitted drop. The caller runs the command and refreshes `cards`. */
  onMove: (move: KanbanMove) => void;
};

const ALWAYS: KanbanCanDrop = () => true;

type KanbanLaneProps<TCard extends KanbanCardData> = {
  column: KanbanColumnData;
  cards: readonly TCard[];
  state: KanbanColumnDropState;
  emptyLabel: string;
  renderCard: KanbanRenderCard<TCard>;
};

function KanbanLane<TCard extends KanbanCardData>(props: KanbanLaneProps<TCard>) {
  const { column, cards, state, emptyLabel, renderCard } = props;
  return (
    <KanbanColumn
      column={column}
      count={cards.length}
      accepting={state.accepting}
      zones={state.zones}
      emptyLabel={emptyLabel}
    >
      {cards.map((card) => (
        <KanbanCard key={card.id} id={card.id}>
          {renderCard(card)}
        </KanbanCard>
      ))}
    </KanbanColumn>
  );
}

/**
 * A board of lanes whose cards move between lanes by drag or keyboard. Order inside a lane is
 * data-driven. A lane with several zones splits into one target per zone while a card is dragged.
 */
export function KanbanBoard<TCard extends KanbanCardData>({
  columns,
  cards,
  renderCard,
  labels,
  canDrop = ALWAYS,
  onMove,
}: KanbanBoardProps<TCard>) {
  const drop = useKanbanDrop({ cards, columns, canDrop, onMove });
  return (
    <DndContext
      {...useKanbanSensors()}
      {...drop.handlers}
      collisionDetection={closestCorners}
      accessibility={{
        announcements: buildKanbanAnnouncements({ cards, columns, labels }),
        screenReaderInstructions: { draggable: labels.dragInstructions },
      }}
    >
      <div data-slot="kanban-board" className="flex h-full snap-x gap-3 overflow-x-auto p-1">
        {columns.map((column) => (
          <KanbanLane
            key={column.id}
            column={column}
            cards={cards.filter((c) => c.columnId === column.id)}
            state={drop.columnState({ column })}
            emptyLabel={labels.emptyColumn}
            renderCard={renderCard}
          />
        ))}
      </div>
      <DragOverlay>
        {drop.active ? (
          <div className="rounded-lg border bg-card p-3 shadow-lg">{renderCard(drop.active)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
