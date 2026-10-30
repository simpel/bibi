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
import { KanbanStatusTray } from "./kanban-status-tray";
import { useCustomizeDrag } from "./use-customize-drag";

import { useCustomizeSensors } from "./use-customize-sensors";

export type KanbanCustomizeBoardProps = {
  phases: readonly KanbanPhaseData[];
  /** Every status that can be placed; those on no column show in the tray. */
  statuses: readonly KanbanStatusChipData[];
  /** False shows the columns' fronts; true turns them over to their settings. */
  flipped: boolean;
  labels: KanbanCustomizeLabels;
  slots: KanbanCustomizeSlots;
  onReorderPhases: (input: { ids: string[] }) => void;
  onMoveStatus: (move: KanbanStatusMove) => void;
};

/**
 * The board in customize mode: columns are sortable left and right by their handle, and status
 * chips move between columns and a "not on this board" tray. Pointer and keyboard (space, arrows,
 * space) both work and are announced. The caller saves each drop and refreshes the props.
 */
export function KanbanCustomizeBoard(props: KanbanCustomizeBoardProps) {
  const { phases, statuses, labels, slots } = props;
  const drag = useCustomizeDrag(props);
  const placed = new Set(phases.flatMap((phase) => phase.statusIds));
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
        <KanbanStatusTray
          statuses={statuses.filter((status) => !placed.has(status.id))}
          labels={labels}
          renderChipMenu={slots.renderChipMenu}
          footer={slots.trayFooter}
        />
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
