"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { buildCustomizeAnnouncements } from "./kanban-customize-announcements";
import { customizeCollision } from "./kanban-customize-dnd";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanPhaseData,
  KanbanStatusChipData,
  KanbanStatusMove,
} from "./kanban-customize-types";
import { KanbanPhaseRow } from "./kanban-phase-row";
import { useCustomizeDrag } from "./use-customize-drag";

import { useCustomizeSensors } from "./use-customize-sensors";

export type KanbanCustomizeBoardProps = {
  phases: readonly KanbanPhaseData[];
  /** Every status that can be placed; those on no column show in the unphased column. */
  statuses: readonly KanbanStatusChipData[];
  /** False shows the columns' fronts; true turns them over to their settings. */
  flipped: boolean;
  labels: KanbanCustomizeLabels;
  slots: KanbanCustomizeSlots;
  onReorderPhases: (input: { ids: string[] }) => void;
  onMoveStatus: (move: KanbanStatusMove) => void;
  /** Called when the columns have finished turning, e.g. to leave customize mode after. */
  onFlipEnd?: (input: { flipped: boolean }) => void;
};

/**
 * The board in customize mode: columns are sortable left and right by their handle, and status
 * chips move between columns and the unphased column on the far left. Pointer and keyboard (space, arrows,
 * space) both work and are announced. The caller saves each drop and refreshes the props.
 */
export function KanbanCustomizeBoard(props: KanbanCustomizeBoardProps) {
  const { phases, statuses, labels } = props;
  const drag = useCustomizeDrag(props);
  return (
    <DndContext
      {...useCustomizeSensors()}
      collisionDetection={customizeCollision}
      modifiers={drag.dragging?.type === "phase" ? [restrictToHorizontalAxis] : []}
      onDragStart={drag.start}
      onDragEnd={drag.end}
      onDragCancel={drag.cancel}
      accessibility={{
        announcements: buildCustomizeAnnouncements({ phases, statuses, labels }),
        screenReaderInstructions: { draggable: labels.dragInstructions },
      }}
    >
      <div data-slot="kanban-customize-board" className="flex h-full min-h-0 flex-col gap-3">
        <KanbanPhaseRow {...props} />
      </div>
      <DragOverlay>
        {drag.title ? (
          <div className="rounded-md border bg-card px-3 py-1.5 text-sm font-medium shadow-lg">
            {drag.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
