import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Fragment } from "react";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanPhaseData,
  KanbanStatusChipData,
} from "./kanban-customize-types";
import { KanbanPhaseColumn } from "./kanban-phase-column";

export type KanbanPhaseRowProps = {
  phases: readonly KanbanPhaseData[];
  statuses: readonly KanbanStatusChipData[];
  flipped: boolean;
  labels: KanbanCustomizeLabels;
  slots: KanbanCustomizeSlots;
};

/** The sortable row of columns, with an "add column" slot between columns and after the last. */
export function KanbanPhaseRow({ phases, statuses, flipped, labels, slots }: KanbanPhaseRowProps) {
  const byId = new Map(statuses.map((status) => [status.id, status]));
  return (
    <div className="flex min-h-0 flex-1 snap-x items-stretch gap-3 overflow-x-auto p-1">
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
