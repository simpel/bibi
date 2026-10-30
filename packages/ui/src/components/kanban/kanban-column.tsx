"use client";

import { useDroppable } from "@dnd-kit/core";
import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { KanbanColumnHeader } from "./kanban-column-header";
import type { KanbanColumnData, KanbanZoneData } from "./kanban-types";
import { KanbanZones } from "./kanban-zone";

export type KanbanColumnProps = {
  column: KanbanColumnData;
  count: number;
  /** Whether the card being dragged may land here. `undefined` while nothing is dragged. */
  accepting: boolean | undefined;
  /**
   * While a card is dragged over a column with several zones: each zone and whether it accepts
   * the card. The zones then take the drop instead of the column.
   */
  zones?: readonly { zone: KanbanZoneData; accepting: boolean }[];
  emptyLabel: string;
  children: ReactNode;
};

export const kanbanColumnVariants = cva(
  "flex w-72 shrink-0 snap-start flex-col gap-2 rounded-xl bg-muted/50 p-2 transition-colors",
  {
    variants: {
      drop: {
        idle: "",
        refused: "opacity-60",
        open: "ring-1 ring-border",
        over: "bg-accent ring-2 ring-ring",
      },
    },
    defaultVariants: { drop: "idle" },
  },
);

type DropState = "idle" | "refused" | "open" | "over";

const dropState = ({ accepting, isOver }: { accepting?: boolean; isOver: boolean }): DropState => {
  if (accepting === undefined) return "idle";
  if (!accepting) return "refused";
  return isOver ? "over" : "open";
};

const BODY = "relative flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto";

/** One lane. Highlights only when the dragged card is allowed to drop here. */
export function KanbanColumn({
  column,
  count,
  accepting,
  zones = [],
  emptyLabel,
  children,
}: KanbanColumnProps) {
  const zoned = zones.length > 0;
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: accepting === false || zoned,
  });
  return (
    <section
      ref={setNodeRef}
      data-slot="kanban-column"
      aria-label={column.title}
      className={kanbanColumnVariants({ drop: dropState({ accepting, isOver }) })}
    >
      <KanbanColumnHeader column={column} count={count} />
      <div className={cn(BODY, zoned && "min-h-32")}>
        {count === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          children
        )}
        {zoned ? <KanbanZones zones={zones} /> : null}
      </div>
    </section>
  );
}

export type KanbanColumnFaceProps = {
  column: KanbanColumnData;
  count: number;
  emptyLabel: string;
  children?: ReactNode;
};

/** A column as it looks on the board, without drag and drop: the front of a flipping column. */
export function KanbanColumnFace({ column, count, emptyLabel, children }: KanbanColumnFaceProps) {
  return (
    <section
      data-slot="kanban-column-face"
      aria-label={column.title}
      className="flex h-full flex-col gap-2 rounded-xl bg-muted/50 p-2"
    >
      <KanbanColumnHeader column={column} count={count} />
      <div className="flex min-h-12 flex-col gap-2 overflow-hidden">
        {count === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
