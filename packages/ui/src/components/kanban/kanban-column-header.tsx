import type { ReactNode } from "react";
import { Badge } from "../badge/badge";
import { NumberFlow } from "../hero-number/hero-number";
import type { KanbanColumnData } from "./kanban-types";

export type KanbanColumnHeaderProps = {
  column: KanbanColumnData;
  count: number;
  /** Centred between the title and the count, e.g. the lane's total value. */
  summary?: ReactNode;
};

/** The lane's title, summary and card count on one row; the numbers animate as cards move. */
export function KanbanColumnHeader({ column, count, summary }: KanbanColumnHeaderProps) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 text-sm font-medium">
      <span className="truncate">{column.title}</span>
      <span className="font-sans text-xs tabular-nums text-muted-foreground">{summary}</span>
      <Badge variant="secondary" className="justify-self-end font-sans tabular-nums">
        <NumberFlow value={count} />
      </Badge>
    </header>
  );
}
