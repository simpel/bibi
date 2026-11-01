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
  KanbanRenderSummary,
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
  /** A line under each lane's title from its cards, e.g. their total value. */
  renderSummary?: KanbanRenderSummary<TCard>;
};

const ALWAYS: KanbanCanDrop = () => true;

type KanbanLaneProps<TCard extends KanbanCardData> = {
  column: KanbanColumnData;
  cards: readonly TCard[];
  state: KanbanColumnDropState;
  emptyLabel: string;
  renderCard: KanbanRenderCard<TCard>;
  renderSummary?: KanbanRenderSummary<TCard> | undefined;
};

function KanbanLane<TCard extends KanbanCardData>(props: KanbanLaneProps<TCard>) {
  const { column, cards, state, emptyLabel, renderCard, renderSummary } = props;
  return (
    <KanbanColumn
      column={column}
      count={cards.length}
      accepting={state.accepting}
      zones={state.zones}
      emptyLabel={emptyLabel}
      summary={renderSummary?.({ column, cards })}
    >
      {cards.map((card) => (
        <KanbanCard key={card.id} id={card.id}>
          {renderCard(card)}
        </KanbanCard>
      ))}
    </KanbanColumn>
  );
}

type KanbanOverlayProps<TCard extends KanbanCardData> = {
  active: TCard | undefined;
  renderCard: KanbanRenderCard<TCard>;
};

/** The card under the pointer while it is dragged. */
function KanbanOverlay<TCard extends KanbanCardData>({
  active,
  renderCard,
}: KanbanOverlayProps<TCard>) {
  return (
    <DragOverlay>
      {active ? (
        <div className="rounded-lg border bg-card p-3 shadow-lg">{renderCard(active)}</div>
      ) : null}
    </DragOverlay>
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
  renderSummary,
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
            renderSummary={renderSummary}
          />
        ))}
      </div>
      <KanbanOverlay active={drop.active} renderCard={renderCard} />
    </DndContext>
  );
}
