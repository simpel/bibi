import type { Ref } from "react";
import { cn } from "../../lib/cn";
import { ROW_GRID } from "./availability-row";
import { addDays, formatDate, formatDay, isoWeek, weekdayOf } from "./calendar-dates";
import { HourLabels } from "./time-axis";
import type { TimelineFrame } from "./timeline-scale";

const dateOf = ({ frame, index }: { frame: TimelineFrame; index: number }) =>
  addDays({ date: frame.start, days: index });

/**
 * A day's name, pinned just right of the asset names while its day scrolls past, so you always
 * know which day you are in. Clicking it zooms in to that day.
 */
function DayHeading({ frame, index }: { frame: TimelineFrame; index: number }) {
  const date = dateOf({ frame, index });
  return (
    <div
      className={cn("absolute inset-y-0", date === frame.today && "border-t-4 border-primary")}
      style={{ left: index * frame.pitch, width: frame.dayPx }}
    >
      <button
        type="button"
        onClick={() => frame.onDrill({ date })}
        className={cn(
          "sticky left-[calc(var(--label)+0.5rem)] mt-1 block w-fit truncate rounded-sm px-1 text-xs font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
          date === frame.today && "font-bold text-primary",
        )}
      >
        {formatDay({ date, format: frame.formatDate })}
      </button>
      {frame.detail === "hours" ? (
        <div className="absolute inset-x-0 bottom-1">
          <HourLabels window={frame.hours} />
        </div>
      ) : null}
    </div>
  );
}

/** Month zoom, top tier: the week number and month, pinned while the week scrolls past. */
function WeekHeading({ frame, index }: { frame: TimelineFrame; index: number }) {
  const date = dateOf({ frame, index });
  const month = formatDate({
    date: addDays({ date, days: 3 }),
    locale: frame.locale,
    options: { month: "short" },
  });
  return (
    <div
      className="absolute top-0 h-5 border-l"
      style={{ left: index * frame.pitch, width: 7 * frame.pitch - 2 }}
    >
      <span className="sticky left-[calc(var(--label)+0.25rem)] px-1 text-xs font-medium whitespace-nowrap">
        {month} · W{isoWeek({ date })}
      </span>
    </div>
  );
}

/** Month zoom, bottom tier: the day of the month over its weekday initial. */
function DayNumber({ frame, index }: { frame: TimelineFrame; index: number }) {
  const date = dateOf({ frame, index });
  const weekday = formatDate({ date, locale: frame.locale, options: { weekday: "narrow" } });
  return (
    <div
      className={cn(
        "absolute inset-y-0 grid content-end pb-0.5 text-center text-[0.625rem] leading-tight tabular-nums",
        weekdayOf({ date }) >= 5 && "text-muted-foreground",
        date === frame.today && "border-t-4 border-primary font-bold text-primary",
      )}
      style={{ left: index * frame.pitch, width: frame.dayPx }}
    >
      <span>{Number(date.slice(8))}</span>
      <span className="opacity-70">{weekday}</span>
    </div>
  );
}

/** Indexes of the Mondays to draw, plus the week that holds the first drawn day. */
function weekStarts({ frame }: { frame: TimelineFrame }) {
  const first = frame.drawn[0] ?? 0;
  const monday = ({ index }: { index: number }) =>
    index - weekdayOf({ date: dateOf({ frame, index }) });
  const starts = new Set([
    monday({ index: first }),
    ...frame.drawn.filter((index) => monday({ index }) === index),
  ]);
  return [...starts];
}

export type TimelineHeaderProps = { frame: TimelineFrame; labelRef: Ref<HTMLDivElement> };

/** Days on top, hours under them; zoomed out to months, weeks on top and days under them. */
export function TimelineHeader({ frame, labelRef }: TimelineHeaderProps) {
  const cells = frame.detail === "cells";
  return (
    <div className={cn(ROW_GRID, "sticky top-0 z-40 border-b bg-card")}>
      <div ref={labelRef} className="sticky left-0 z-10 border-r bg-card" />
      <div className="relative h-11" style={{ width: frame.width }}>
        {cells
          ? weekStarts({ frame }).map((index) => (
              <WeekHeading key={`w${index}`} frame={frame} index={index} />
            ))
          : null}
        {frame.drawn.map((index) =>
          cells ? (
            <DayNumber key={index} frame={frame} index={index} />
          ) : (
            <DayHeading key={index} frame={frame} index={index} />
          ),
        )}
      </div>
    </div>
  );
}
