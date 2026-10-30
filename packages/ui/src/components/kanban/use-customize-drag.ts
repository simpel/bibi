import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";
import { dropContainer, phaseOrderAfterDrop, readDragData } from "./kanban-customize-dnd";
import type {
  KanbanPhaseData,
  KanbanStatusChipData,
  KanbanStatusMove,
} from "./kanban-customize-types";

export type UseCustomizeDragInput = {
  phases: readonly KanbanPhaseData[];
  statuses: readonly KanbanStatusChipData[];
  onReorderPhases: (input: { ids: string[] }) => void;
  onMoveStatus: (move: KanbanStatusMove) => void;
};

type Dragging = { type: "phase" | "chip"; id: string };

/** The drag in progress and what a drop means: a new column order or a chip in another list. */
export function useCustomizeDrag({
  phases,
  statuses,
  onReorderPhases,
  onMoveStatus,
}: UseCustomizeDragInput) {
  const [dragging, setDragging] = useState<Dragging | null>(null);
  const title = dragging
    ? (phases.find((p) => p.id === dragging.id) ?? statuses.find((s) => s.id === dragging.id))
        ?.title
    : undefined;

  const start = ({ active }: DragStartEvent) => {
    const data = readDragData({ data: active.data.current });
    setDragging(data && data.type !== "chips" ? { type: data.type, id: String(active.id) } : null);
  };

  const end = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const data = readDragData({ data: active.data.current });
    const to = over ? dropContainer({ over: over.data.current }) : undefined;
    if (!data || to === undefined) return;
    if (data.type === "phase" && to !== null) {
      const ids = phaseOrderAfterDrop({
        ids: phases.map((phase) => phase.id),
        activeId: data.phaseId,
        overId: to,
      });
      if (ids) onReorderPhases({ ids });
    }
    if (data.type === "chip" && to !== data.containerId) {
      onMoveStatus({ statusId: data.statusId, fromPhaseId: data.containerId, toPhaseId: to });
    }
  };

  return { dragging, title, start, end, cancel: () => setDragging(null) };
}
