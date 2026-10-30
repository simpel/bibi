import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Fragment, useRef } from "react";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanPhaseData,
  KanbanStatusChipData,
} from "./kanban-customize-types";
import { KanbanPhaseColumn } from "./kanban-phase-column";
import { KanbanUnphasedColumn } from "./kanban-unphased-column";
import { usePhaseFlipMotion } from "./use-phase-flip-motion";

export type KanbanPhaseRowProps = {
  phases: readonly KanbanPhaseData[];
  /** Every status that can be placed; those on no column show in the unphased column. */
  statuses: readonly KanbanStatusChipData[];
  flipped: boolean;
  labels: KanbanCustomizeLabels;
  slots: KanbanCustomizeSlots;
  onFlipEnd?: (input: { flipped: boolean }) => void;
};

/**
 * The row of columns: the unphased column on the far left, then the sortable columns with an
 * "add column" slot between columns and after the last.
 */
export function KanbanPhaseRow({
  phases,
  statuses,
  flipped,
  labels,
  slots,
  onFlipEnd,
}: KanbanPhaseRowProps) {
  const row = useRef<HTMLDivElement>(null);
  usePhaseFlipMotion({ scope: row, flipped, onFlipEnd });
  const byId = new Map(statuses.map((status) => [status.id, status]));
  const placed = new Set(phases.flatMap((phase) => phase.statusIds));
  return (
    <div ref={row} className="flex min-h-0 flex-1 snap-x items-stretch gap-3 overflow-x-auto p-1">
      <KanbanUnphasedColumn
        statuses={statuses.filter((status) => !placed.has(status.id))}
        labels={labels}
        renderChipMenu={slots.renderChipMenu}
        footer={slots.unphasedFooter}
      />
      <SortableContext items={phases.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
        {phases.map((phase, index) => (
          <Fragment key={phase.id}>
            {index > 0 ? slots.renderAddColumn?.({ position: index }) : null}
            <KanbanPhaseColumn
              phase={phase}
              statuses={phase.statusIds.flatMap((id) => byId.get(id) ?? [])}
              flipped={flipped}
              labels={labels}
              slots={slots}
            />
          </Fragment>
        ))}
      </SortableContext>
      {slots.renderAddColumn?.({ position: phases.length })}
    </div>
  );
}
