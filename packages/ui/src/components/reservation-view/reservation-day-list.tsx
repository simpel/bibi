import { TriangleAlertIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../badge/badge";
import { Card } from "../card/card";
import { StatusBadge } from "../data-table/data-table-column-helpers";
import type { ReservationViewData } from "./reservation-card";

export type ReservationDayListProps = Omit<ComponentProps<"div">, "children"> & {
  /** E.g. "12 reservations" and "46 covers". */
  reservationsLabel: string;
  coversLabel: string;
  /** Summed needs, e.g. "Gluten 5". */
  needs: readonly string[];
  rows: readonly (ReservationViewData & { id: string })[];
  emptyLabel: string;
  tablesLabel: string;
  anonymousLabel: string;
};

/** The totals of a day (reservations, covers, needs) above one row per reservation. */
export function ReservationDayList({
  reservationsLabel,
  coversLabel,
  needs,
  rows,
  emptyLabel,
  tablesLabel,
  anonymousLabel,
  className,
  ...props
}: ReservationDayListProps) {
  return (
    <Card
      data-slot="reservation-day-list"
      className={cn("gap-0 overflow-hidden p-0 text-sm shadow-none", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-2">
        <span className="font-medium">{reservationsLabel}</span>
        <span className="font-medium">{coversLabel}</span>
        {needs.map((need) => (
          <Badge key={need} variant="outline">
            {need}
          </Badge>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-2 text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-3 py-2"
            >
              <span className="font-medium tabular-nums">{row.time}</span>
              <span className="truncate">
                {row.name ?? anonymousLabel}
                <span className="text-muted-foreground">
                  {" · "}
                  {row.party}
                  {row.tables.length > 0 ? ` · ${tablesLabel} ${row.tables.join(", ")}` : ""}
                </span>
                {row.warnings.length > 0 ? (
                  <TriangleAlertIcon
                    aria-label={row.warnings.join(" · ")}
                    className="ml-1.5 inline size-3.5 text-warning-foreground"
                  />
                ) : null}
              </span>
              <StatusBadge label={row.state.label} color={row.state.color} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
