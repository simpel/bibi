import type { ReactNode } from "react";
import { Badge } from "../badge/badge";
import { NumberFlow } from "../hero-number/hero-number";
import type { KanbanColumnData } from "./kanban-types";

export type KanbanColumnHeaderProps = {
  column: KanbanColumnData;
  count: number;
  /** On its own row under the title, e.g. the lane's totals (`MoneyTotals` at `sm`). */
  summary?: ReactNode;
};

/** The lane's title and card count, with the summary under them; the numbers animate as cards move. */
export function KanbanColumnHeader({ column, count, summary }: KanbanColumnHeaderProps) {
  return (
    <header className="grid gap-0.5 px-1">
      <div className="flex items-center justify-between gap-2 text-sm font-medium">
        <span className="truncate">{column.title}</span>
        <Badge variant="secondary" className="font-sans tabular-nums">
          <NumberFlow value={count} />
        </Badge>
      </div>
      {summary ? <div className="min-w-0">{summary}</div> : null}
    </header>
  );
}
