import type { Ref } from "react";
import { cn } from "../../lib/cn";
import { ROW_GRID } from "./availability-row";
import { addDays, formatDate, formatDay, weekdayOf } from "./calendar-dates";
import type { DayTotal } from "./day-value";
import { DayValuePeek, DayValueStrip } from "./day-value-peek";
import { HourLabels } from "./time-axis";
import type { TimelineFrame } from "./timeline-scale";
import { WeekHeading } from "./week-heading";

const dateOf = ({ frame, index }: { frame: TimelineFrame; index: number }) =>
  addDays({ date: frame.start, days: index });

/** Today's bar along the top, drawn over the column so nothing under it moves. */
function TodayBar({ date, frame }: { date: string; frame: TimelineFrame }) {
  if (date !== frame.today) return null;
  return <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />;
}

type DayProps = { frame: TimelineFrame; index: number; total: DayTotal | undefined };

/**
 * A day's name and how much of it is sold, pinned just right of the asset names while its day
 * scrolls past, so you always know which day you are in. Clicking the name zooms in to that day.
 * Under it the day's value bar, the same in every zoom; hover the name or the bar, or tap the
 * bar, for the amounts.
 */
function DayHeading({ frame, index, total }: DayProps) {
  const date = dateOf({ frame, index });
  const day = formatDay({ date, format: frame.formatDate });
  return (
    <div className="absolute inset-y-0" style={{ left: index * frame.pitch, width: frame.dayPx }}>
      <TodayBar date={date} frame={frame} />
      <DayValuePeek total={total} day={day}>
        <div className="absolute inset-x-0 top-0 h-[3.25rem] pt-2">
          <button
            type="button"
            onClick={() => frame.onDrill({ date })}
            // A tap on the name zooms in; on touch only the bar opens the amounts.
            onPointerUp={(event) => event.stopPropagation()}
            className={cn(
              "sticky left-[calc(var(--label)+0.5rem)] max-w-[calc(100%-1rem)] truncate rounded-sm text-xs leading-5 font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
              date === frame.today && "font-bold text-primary",
            )}
          >
            {day}
          </button>
          <DayValueStrip total={total} className="absolute inset-x-1 top-8 h-5" />
        </div>
      </DayValuePeek>
      {frame.detail === "hours" ? (
        <div className="absolute inset-x-0 bottom-1">
          <HourLabels window={frame.hours} />
        </div>
      ) : null}
    </div>
  );
}

/** Month zoom, bottom tier: the day of the month over its weekday initial. */
function DayNumber({ frame, index }: DayProps) {
  const date = dateOf({ frame, index });
  const weekday = formatDate({ date, locale: frame.locale, options: { weekday: "narrow" } });
  return (
    <div
      className={cn(
        "absolute inset-y-0 grid content-end pb-0.5 text-center text-[0.625rem] leading-tight tabular-nums",
        weekdayOf({ date }) >= 5 && "text-muted-foreground",
        date === frame.today && "font-bold text-primary",
      )}
      style={{ left: index * frame.pitch, width: frame.dayPx }}
    >
      <TodayBar date={date} frame={frame} />
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

export type TimelineHeaderProps = {
  frame: TimelineFrame;
  labelRef: Ref<HTMLDivElement>;
  /** What each day is worth across the assets shown, by day key. */
  totals?: ReadonlyMap<string, DayTotal> | undefined;
};

/**
 * Days on top, hours under them; zoomed out to months, weeks on top and days under them. Hours
 * get a taller header, so the value bar keeps its place between the day and the axis.
 */
export function TimelineHeader({ frame, labelRef, totals }: TimelineHeaderProps) {
  const cells = frame.detail === "cells";
  return (
    <div className={cn(ROW_GRID, "sticky top-0 z-40 border-b bg-card")}>
      <div ref={labelRef} className="sticky left-0 z-20 border-r bg-card" />
      <div
        className={cn("relative", frame.detail === "hours" ? "h-[4.5rem]" : "h-14")}
        style={{ width: frame.width }}
      >
        {cells
          ? weekStarts({ frame }).map((index) => (
              <WeekHeading key={`w${index}`} {...{ frame, index, totals }} />
            ))
          : null}
        {frame.drawn.map((index) => {
          const total = totals?.get(dateOf({ frame, index }));
          return cells ? (
            <DayNumber key={index} {...{ frame, index, total }} />
          ) : (
            <DayHeading key={index} {...{ frame, index, total }} />
          );
        })}
      </div>
    </div>
  );
}
