import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../badge/badge";
import { Card } from "../card/card";

export type TableBlockViewData = {
  id: string;
  /** Table numbers; empty when unknown. */
  tables: readonly string[];
  /** Blocked or kept for walk-ins, already translated. */
  kind: string;
  /** Whether nobody can book it (otherwise staff still may). */
  blocking: boolean;
  /** Already formatted in the room's zone, e.g. "Thu 17:00–22:00". */
  period: string;
  note: string | null;
};

export type TableBlockListProps = Omit<ComponentProps<"div">, "children"> & {
  items: readonly TableBlockViewData[];
  emptyLabel: string;
  tablesLabel: string;
};

/** Held-back tables: which, how (blocked or kept for walk-ins), when and why. */
export function TableBlockList({
  items,
  emptyLabel,
  tablesLabel,
  className,
  ...props
}: TableBlockListProps) {
  return (
    <Card
      data-slot="table-block-list"
      className={cn("gap-0 overflow-hidden p-0 text-sm shadow-none", className)}
      {...props}
    >
      {items.length === 0 ? <p className="px-3 py-2 text-muted-foreground">{emptyLabel}</p> : null}
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-0.5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {tablesLabel} {item.tables.join(", ")}
              </span>
              <Badge variant={item.blocking ? "destructive" : "secondary"}>{item.kind}</Badge>
            </div>
            <span className="tabular-nums text-muted-foreground">{item.period}</span>
            {item.note ? <span>{item.note}</span> : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
