import { TriangleAlertIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../badge/badge";
import { Card } from "../card/card";
import { StatusBadge } from "../data-table/data-table-column-helpers";

export type ReservationViewState = { label: string; color?: string | null };

export type ReservationViewData = {
  /** Already formatted in the room's zone, e.g. "Thu 19:00" or "19:00–21:00". */
  time: string;
  /** E.g. "4 guests". */
  party: string;
  /** Table numbers, e.g. ["12", "13"]; empty when none. */
  tables: readonly string[];
  /** Null after erasure. */
  name: string | null;
  state: ReservationViewState;
  /** Counts against the organization's lists, e.g. "Gluten 5". */
  needs: readonly string[];
  /** One short note for the warnings, e.g. "Over the pace limit"; empty when none. */
  warnings: readonly string[];
  note?: string | null | undefined;
};

export type ReservationCardProps = Omit<ComponentProps<"div">, "children"> & {
  reservation: ReservationViewData;
  /** Table prefix, e.g. "Table". */
  tablesLabel: string;
  noTablesLabel: string;
  anonymousLabel: string;
};

/** One reservation as an assistant result: time, party, tables, booker, state, needs, warnings. */
export function ReservationCard({
  reservation,
  tablesLabel,
  noTablesLabel,
  anonymousLabel,
  className,
  ...props
}: ReservationCardProps) {
  const { time, party, tables, name, state, needs, warnings, note } = reservation;
  return (
    <Card
      data-slot="reservation-card"
      className={cn("gap-2 p-3 text-sm shadow-none", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium tabular-nums">{time}</span>
        <StatusBadge label={state.label} color={state.color} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>{name ?? anonymousLabel}</span>
        <span className="text-muted-foreground">{party}</span>
        <span className="text-muted-foreground">
          {tables.length > 0 ? `${tablesLabel} ${tables.join(", ")}` : noTablesLabel}
        </span>
      </div>
      {needs.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {needs.map((need) => (
            <Badge key={need} variant="outline">
              {need}
            </Badge>
          ))}
        </div>
      ) : null}
      {note ? <p className="text-muted-foreground">{note}</p> : null}
      {warnings.length > 0 ? (
        <p className="flex items-center gap-1.5 text-warning-foreground">
          <TriangleAlertIcon aria-hidden className="size-3.5 shrink-0" />
          {warnings.join(" · ")}
        </p>
      ) : null}
    </Card>
  );
}
