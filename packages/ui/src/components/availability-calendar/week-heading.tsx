import { addDays, formatDate, formatDays, isoWeek } from "./calendar-dates";
import { type DayTotal, totalOf } from "./day-value";
import { DayRate } from "./day-value-peek";
import type { TimelineFrame } from "./timeline-scale";

export type WeekHeadingProps = {
  frame: TimelineFrame;
  index: number;
  totals?: ReadonlyMap<string, DayTotal> | undefined;
};

/**
 * Month zoom, top tier: the week number and month, pinned while the week scrolls past, with the
 * week's booked share; its card names the week and its days.
 */
export function WeekHeading({ frame, index, totals }: WeekHeadingProps) {
  const date = addDays({ date: frame.start, days: index });
  const thursday = addDays({ date, days: 3 });
  const month = formatDate({ date: thursday, locale: frame.locale, options: { month: "short" } });
  const days = Array.from({ length: 7 }, (_, n) => addDays({ date, days: n }));
  const total = totals ? totalOf({ totals, dates: days }) : undefined;
  const span = formatDays({ from: date, to: days[6] ?? date, format: frame.formatDate });
  const name = `W${isoWeek({ date })} · ${span}`;
  return (
    <div
      className="absolute top-0 z-10 h-5 border-l"
      style={{ left: index * frame.pitch, width: 7 * frame.pitch - 2 }}
    >
      <span className="sticky left-[calc(var(--label)+0.25rem)] inline-flex max-w-full items-center gap-1.5 px-1 text-xs leading-5 font-medium whitespace-nowrap">
        {month} · W{isoWeek({ date })}
        <DayRate total={total} day={name} />
      </span>
    </div>
  );
}
