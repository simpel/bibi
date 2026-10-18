import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { KanbanColumnHeader } from "./kanban-column-header";
import type { KanbanColumnData } from "./kanban-types";

export type KanbanColumnProps = {
  column: KanbanColumnData;
  count: number;
  /** Whether the card being dragged may land here. `undefined` while nothing is dragged. */
  accepting: boolean | undefined;
  emptyLabel: string;
  children: ReactNode;
};

/** One lane. Highlights only when the dragged card is allowed to drop here. */
export function KanbanColumn({
  column,
  count,
  accepting,
  emptyLabel,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled: accepting === false });
  return (
    <section
      ref={setNodeRef}
      data-slot="kanban-column"
      aria-label={column.title}
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col gap-2 rounded-xl bg-muted/50 p-2 transition-colors",
        accepting === false && "opacity-60",
        accepting && "ring-1 ring-border",
        isOver && accepting && "bg-accent ring-2 ring-ring",
      )}
    >
      <KanbanColumnHeader column={column} count={count} />
      <div className="flex min-h-12 flex-col gap-2 overflow-y-auto">
        {count === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
