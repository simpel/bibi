import { percentIn, toMinutes } from "../../components/availability-calendar/calendar-time";
import type {
  CalendarLine,
  CalendarWindow,
} from "../../components/availability-calendar/calendar-types";

/**
 * A package on a horizontal track: a grey bracket over the time its parts fill. It frames, it
 * does not hold, so it never takes a state hue.
 */
export function FrameBracket({ line, window }: { line: CalendarLine; window: CalendarWindow }) {
  const { offset, size } = percentIn({
    window,
    from: toMinutes({ time: line.start }),
    to: toMinutes({ time: line.end }),
  });
  return (
    <div
      className="absolute top-1/2 flex -translate-y-1/2 flex-col gap-1"
      style={{ left: `${offset}%`, width: `${size}%` }}
    >
      <span className="text-xs font-medium text-muted-foreground tabular-nums">
        {line.start}–{line.end}
      </span>
      <span className="h-2 rounded-t-sm border-x-2 border-t-2 border-muted-foreground/60" />
    </div>
  );
}

/** The bundle frames its parts: a tinted band with its name, behind the columns. */
export function FrameBand({ line, window }: { line: CalendarLine; window: CalendarWindow }) {
  const { offset, size } = percentIn({
    window,
    from: toMinutes({ time: line.start }),
    to: toMinutes({ time: line.end }),
  });
  return (
    <div
      className="absolute inset-x-0 rounded-lg ring-1 ring-border ring-inset"
      style={{ top: `${offset}%`, height: `${size}%` }}
    >
      <span className="absolute -top-2.5 right-2 rounded-sm bg-card px-1.5 text-[0.6875rem] font-medium text-muted-foreground">
        {line.name} {line.start}–{line.end}
      </span>
    </div>
  );
}
