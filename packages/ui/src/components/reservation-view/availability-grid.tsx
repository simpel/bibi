import { TriangleAlertIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Card } from "../card/card";

export type AvailabilityGridSlot = {
  /** Already formatted in the room's zone, e.g. "19:00". */
  time: string;
  available: boolean;
  /** Warning words; the chip is marked when there are any. */
  warnings: readonly string[];
  /** E.g. "6 already coming". */
  detail?: string | undefined;
};

export type AvailabilityGridGroup = {
  id: string;
  name: string;
  slots: readonly AvailabilityGridSlot[];
};

export type AvailabilityGridProps = Omit<ComponentProps<"div">, "children"> & {
  groups: readonly AvailabilityGridGroup[];
  emptyLabel: string;
  unavailableLabel: string;
};

/** Slots per sitting: free ones as chips, taken ones greyed, warnings marked. */
export function AvailabilityGrid({
  groups,
  emptyLabel,
  unavailableLabel,
  className,
  ...props
}: AvailabilityGridProps) {
  return (
    <Card
      data-slot="availability-grid"
      className={cn("gap-3 p-3 text-sm shadow-none", className)}
      {...props}
    >
      {groups.length === 0 ? <p className="text-muted-foreground">{emptyLabel}</p> : null}
      {groups.map((group) => (
        <section key={group.id} className="flex flex-col gap-1.5">
          <h4 className="font-medium">{group.name}</h4>
          <ul className="flex flex-wrap gap-1.5">
            {group.slots.map((slot) => (
              <li
                key={slot.time}
                title={[slot.available ? null : unavailableLabel, ...slot.warnings, slot.detail]
                  .filter(Boolean)
                  .join(" · ")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs tabular-nums",
                  slot.available
                    ? "border-success/40 bg-success/10 text-foreground"
                    : "border-transparent bg-muted text-muted-foreground line-through",
                )}
              >
                {slot.time}
                {slot.warnings.length > 0 ? (
                  <TriangleAlertIcon
                    aria-label={slot.warnings.join(" · ")}
                    className="size-3 text-warning-foreground"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Card>
  );
}
