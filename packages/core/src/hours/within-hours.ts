import { addDays, compareDates, type PlainDate, toIsoDate, weekdayOf } from "../time/plain-date";
import { fromZonedParts, toZonedParts } from "../time/zoned-time";
import type { OpenSpan } from "./day-schema";

/** An hours pattern as the evaluator needs it: spans by weekday and by `YYYY-MM-DD`. */
export type HoursLookup = {
  days: ReadonlyMap<number, OpenSpan>;
  /** `null` = closed all day. */
  exceptions: ReadonlyMap<string, OpenSpan | null>;
};

/** An instant interval in epoch milliseconds, `[from, to)`. */
export type Interval = { from: number; to: number };

/** Longest stretch evaluated; a longer line is never within hours. */
const MAX_DAYS = 366;

function instantAt({
  date,
  minute,
  timeZone,
}: {
  date: PlainDate;
  minute: number;
  timeZone: string;
}) {
  const day = minute >= 1440 ? addDays({ date, days: 1 }) : date;
  const rest = minute % 1440;
  const time = { hour: Math.floor(rest / 60), minute: rest % 60, second: 0 };
  return fromZonedParts({ date: day, time, timeZone }).getTime();
}

export type DayInput = { hours: HoursLookup; date: PlainDate; timeZone: string };

/** The open intervals of one local day: the exception if there is one, else the weekday. */
export function openIntervals({ hours, date, timeZone }: DayInput): Interval[] {
  const iso = toIsoDate({ date });
  const span = hours.exceptions.has(iso)
    ? hours.exceptions.get(iso)
    : hours.days.get(weekdayOf({ date }));
  if (!span) return [];
  const at = ({ minute }: { minute: number }) => instantAt({ date, minute, timeZone });
  const { startMinute, endMinute, breakStartMinute: bs, breakEndMinute: be } = span;
  if (bs === null || be === null)
    return [{ from: at({ minute: startMinute }), to: at({ minute: endMinute }) }];
  return [
    { from: at({ minute: startMinute }), to: at({ minute: bs }) },
    { from: at({ minute: be }), to: at({ minute: endMinute }) },
  ];
}

export type WithinHoursInput = {
  hours: HoursLookup;
  timeZone: string;
  startsAt: Date;
  endsAt: Date;
};

/**
 * True when `[startsAt, endsAt)` lies inside open hours in `timeZone` (ADR 0064 rule 11). Days
 * are local, so a 23 or 25 hour day is handled, and a span past midnight must be open on both
 * days. An empty span is judged at its start.
 */
export function withinHours({ hours, timeZone, startsAt, endsAt }: WithinHoursInput): boolean {
  const start = startsAt.getTime();
  const end = Math.max(endsAt.getTime(), start + 1);
  const first = toZonedParts({ instant: startsAt, timeZone }).date;
  const last = toZonedParts({ instant: new Date(end - 1), timeZone }).date;
  const intervals: Interval[] = [];
  for (let date = first, n = 0; compareDates({ a: date, b: last }) <= 0 && n < MAX_DAYS; n++) {
    intervals.push(...openIntervals({ hours, date, timeZone }));
    date = addDays({ date, days: 1 });
  }
  let covered = start;
  for (const { from, to } of intervals.sort((a, b) => a.from - b.from)) {
    if (from > covered) break;
    covered = Math.max(covered, to);
    if (covered >= end) return true;
  }
  return covered >= end;
}
