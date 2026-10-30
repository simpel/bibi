import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { KanbanStatusChipData } from "./kanban-customize-types";

export type KanbanStatusChipProps = {
  status: KanbanStatusChipData;
  /** The column the chip sits in; null = the tray. */
  containerId: string | null;
  countLabel: (count: number) => string;
  /** The chip's menu trigger (edit, transitions, archive), outside the drag handle. */
  menu?: ReactNode;
};

const HANDLE =
  "flex min-w-0 flex-1 cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** A status as a draggable chip. The name is the handle: focus it and press space to lift it. */
export function KanbanStatusChip({ status, containerId, countLabel, menu }: KanbanStatusChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
    data: { type: "chip", statusId: status.id, containerId },
  });
  return (
    <div
      ref={setNodeRef}
      data-slot="kanban-status-chip"
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-md border bg-card text-sm shadow-xs",
        isDragging && "opacity-40",
      )}
    >
      <button type="button" className={HANDLE} {...attributes} {...listeners}>
        <GripVertical aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        {status.color ? (
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: status.color }}
          />
        ) : null}
        <span className="truncate">{status.title}</span>
        {status.count === undefined ? null : (
          <span className="ml-auto font-sans text-xs tabular-nums text-muted-foreground">
            <span aria-hidden>{status.count}</span>
            <span className="sr-only">{countLabel(status.count)}</span>
          </span>
        )}
      </button>
      {menu}
    </div>
  );
}
