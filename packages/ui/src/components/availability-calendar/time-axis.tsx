import { cn } from "../../lib/cn";
import { useCalendarLabels } from "./calendar-labels";
import { hoursIn } from "./calendar-time";
import type { CalendarWindow } from "./calendar-types";

const at = ({ window, hour }: { window: CalendarWindow; hour: number }) =>
  ((hour * 60 - window.from) / (window.to - window.from)) * 100;

/** Hour labels along a horizontal track, in the user's clock and tabular. */
export function HourLabels({ window }: { window: CalendarWindow }) {
  const labels = useCalendarLabels();
  return (
    <div className="relative h-5">
      {hoursIn({ window }).map((hour, index, all) => (
        <span
          key={hour}
          className={cn(
            "absolute text-[0.6875rem] text-muted-foreground tabular-nums",
            index === 0 ? "" : index === all.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
          )}
          style={{ left: `${at({ window, hour })}%` }}
        >
          {labels.hour({ hour })}
        </span>
      ))}
    </div>
  );
}

/** Hour rules behind a track; `axis` y draws horizontal rules for a vertical day. */
export function HourRules({ window, axis = "x" }: { window: CalendarWindow; axis?: "x" | "y" }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {hoursIn({ window }).map((hour, index, all) => (
        <div
          key={hour}
          className={cn(
            "absolute border-border/70",
            axis === "x" ? "inset-y-0 border-l" : "inset-x-0 border-t",
            index === all.length - 1 && (axis === "x" ? "-translate-x-px" : "-translate-y-px"),
          )}
          style={
            axis === "x"
              ? { left: `${at({ window, hour })}%` }
              : { top: `${at({ window, hour })}%` }
          }
        />
      ))}
    </div>
  );
}

/** Height of one hour in the vertical day, in rem. */
export const HOUR_REM = 3;

/** Hour labels down the side of a vertical day. */
export function HourGutter({ window }: { window: CalendarWindow }) {
  const labels = useCalendarLabels();
  return (
    <div className="relative">
      {hoursIn({ window }).map((hour, index) => (
        <span
          key={hour}
          className="absolute right-2 -translate-y-1/2 text-[0.6875rem] text-muted-foreground tabular-nums"
          style={{ top: `${index * HOUR_REM}rem` }}
        >
          {labels.clock({ minutes: hour * 60 })}
        </span>
      ))}
    </div>
  );
}
