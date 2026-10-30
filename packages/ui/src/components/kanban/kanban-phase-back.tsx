import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripHorizontal } from "lucide-react";
import { KanbanChipList } from "./kanban-chip-list";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanPhaseData,
  KanbanStatusChipData,
} from "./kanban-customize-types";

/** The drag handle of a sortable column: its ref, attributes and listeners. */
export type KanbanPhaseHandle = {
  ref: (element: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

export type KanbanPhaseBackProps = {
  phase: KanbanPhaseData;
  statuses: readonly KanbanStatusChipData[];
  labels: KanbanCustomizeLabels;
  slots: KanbanCustomizeSlots;
  handle: KanbanPhaseHandle;
};

const HANDLE =
  "cursor-grab rounded-md p-1 text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";

/** The back of a column in customize mode: drag handle, header slot, status chips and footer. */
export function KanbanPhaseBack({ phase, statuses, labels, slots, handle }: KanbanPhaseBackProps) {
  return (
    <section
      aria-label={phase.title}
      data-slot="kanban-phase-back"
      className="flex h-full flex-col gap-2 rounded-xl border bg-muted/50 p-2"
    >
      <header className="flex items-center gap-1">
        <button
          ref={handle.ref}
          type="button"
          aria-label={labels.phaseHandle(phase.title)}
          className={HANDLE}
          {...handle.attributes}
          {...handle.listeners}
        >
          <GripHorizontal aria-hidden className="size-4" />
        </button>
        <div className="min-w-0 flex-1">{slots.renderPhaseHeader({ phase })}</div>
      </header>
      <KanbanChipList
        containerId={phase.id}
        statuses={statuses}
        emptyLabel={labels.emptyPhase}
        countLabel={labels.count}
        renderChipMenu={slots.renderChipMenu}
      />
      {slots.renderPhaseFooter?.({ phase })}
    </section>
  );
}
