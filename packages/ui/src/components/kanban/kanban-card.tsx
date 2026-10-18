import { useDraggable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type KanbanCardProps = { id: string; children: ReactNode };

/** A draggable card. The whole card is the handle; focus it and press space to lift it. */
export function KanbanCard({ id, children }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      data-slot="kanban-card"
      data-dragging={isDragging || undefined}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 text-card-foreground shadow-xs outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
