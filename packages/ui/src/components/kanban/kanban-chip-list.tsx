import { useDroppable } from "@dnd-kit/core";
import { SortableContext, type SortingStrategy } from "@dnd-kit/sortable";
import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { chipsDropId } from "./kanban-customize-dnd";
import type { KanbanCustomizeSlots, KanbanStatusChipData } from "./kanban-customize-types";
import { KanbanStatusChip } from "./kanban-status-chip";

export const kanbanChipListVariants = cva(
  "flex min-h-12 gap-1.5 rounded-lg p-1 transition-colors",
  {
    variants: {
      inline: { true: "flex-row flex-wrap items-center", false: "flex-col" },
      over: { true: "bg-accent ring-2 ring-ring", false: "" },
    },
    defaultVariants: { inline: false, over: false },
  },
);

/** Chips keep their status order: a drop changes the column, never the order inside it. */
const KEEP_ORDER: SortingStrategy = () => null;

export type KanbanChipListProps = {
  /** The column id; null = the tray. */
  containerId: string | null;
  statuses: readonly KanbanStatusChipData[];
  emptyLabel: string;
  countLabel: (count: number) => string;
  renderChipMenu?: KanbanCustomizeSlots["renderChipMenu"];
  /** Lays the chips out in a row (the tray) instead of a column. */
  inline?: boolean;
  children?: ReactNode;
};

/** A droppable list of status chips: a column's back, or the tray. */
export function KanbanChipList({
  containerId,
  statuses,
  emptyLabel,
  countLabel,
  renderChipMenu,
  inline = false,
  children,
}: KanbanChipListProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: chipsDropId({ phaseId: containerId }),
    data: { type: "chips", containerId },
  });
  return (
    <SortableContext items={statuses.map((status) => status.id)} strategy={KEEP_ORDER}>
      <div
        ref={setNodeRef}
        data-slot="kanban-chip-list"
        className={kanbanChipListVariants({ inline, over: isOver })}
      >
        {statuses.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">{emptyLabel}</p>
        ) : null}
        {statuses.map((status) => (
          <KanbanStatusChip
            key={status.id}
            status={status}
            containerId={containerId}
            countLabel={countLabel}
            menu={renderChipMenu?.({ status, phaseId: containerId })}
          />
        ))}
        {children}
      </div>
    </SortableContext>
  );
}
