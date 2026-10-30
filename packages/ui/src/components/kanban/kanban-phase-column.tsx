import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../lib/cn";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanPhaseData,
  KanbanStatusChipData,
} from "./kanban-customize-types";
import { KanbanFlip } from "./kanban-flip";
import { KanbanPhaseBack } from "./kanban-phase-back";

export type KanbanPhaseColumnProps = {
  phase: KanbanPhaseData;
  statuses: readonly KanbanStatusChipData[];
  flipped: boolean;
  labels: KanbanCustomizeLabels;
  slots: KanbanCustomizeSlots;
};

/**
 * One column in customize mode: it flips to its back, where it can be dragged and edited. The row
 * animates the turn (`usePhaseFlipMotion`).
 */
export function KanbanPhaseColumn({ phase, flipped, ...back }: KanbanPhaseColumnProps) {
  const sortable = useSortable({ id: phase.id, data: { type: "phase", phaseId: phase.id } });
  const handle = {
    ref: sortable.setActivatorNodeRef,
    attributes: sortable.attributes,
    listeners: sortable.listeners,
  };
  return (
    <div
      ref={sortable.setNodeRef}
      data-slot="kanban-phase-column"
      style={{
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn("w-72 shrink-0 snap-start", sortable.isDragging && "z-10 opacity-60")}
    >
      {/* GSAP moves this wrapper; dnd-kit owns the transform of the sortable node above. */}
      <div data-kanban-motion="phase" className="h-full">
        <KanbanFlip
          flipped={flipped}
          transition="none"
          className="h-full"
          front={back.slots.renderFront({ phase })}
          back={<KanbanPhaseBack phase={phase} handle={handle} {...back} />}
        />
      </div>
    </div>
  );
}
