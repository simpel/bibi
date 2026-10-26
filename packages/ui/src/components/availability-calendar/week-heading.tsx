import { addDays, formatDate, formatDays, isoWeek } from "./calendar-dates";
import { type DayTotal, totalOf } from "./day-value";
import { DayValuePeek, DayValueStrip } from "./day-value-peek";
import type { TimelineFrame } from "./timeline-scale";

export type WeekHeadingProps = {
  frame: TimelineFrame;
  index: number;
  totals?: ReadonlyMap<string, DayTotal> | undefined;
};

/**
 * Month zoom, top tier: the week number and month, pinned while the week scrolls past, with the
 * week's value bar under it, as a day's in the other zooms; hover or tap for its card, which names the week and its days.
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
    <DayValuePeek total={total} day={name}>
      <div
        className="absolute top-0 z-10 h-8 border-l"
        style={{ left: index * frame.pitch, width: 7 * frame.pitch - 2 }}
      >
        <span className="sticky left-[calc(var(--label)+0.25rem)] inline-flex max-w-full items-center gap-1.5 px-1 text-xs leading-5 font-medium whitespace-nowrap">
          {month} · W{isoWeek({ date })}
        </span>
        <DayValueStrip total={total} className="absolute inset-x-1 top-5 h-3 pt-0.5" />
      </div>
    </DayValuePeek>
  );
}
