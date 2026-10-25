import {
  addDays,
  addMonths,
  compareDates,
  daysInMonth,
  MAX_CALENDAR_DAYS,
  type PlainDate,
  parseIsoDate,
  toIsoDate,
  weekdayOf,
} from "@bibi/core/schemas";

export const CALENDAR_VIEWS = ["day", "week", "month", "list"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

/** The shown days, both inclusive: the `/calendar/{from}/{to}` path (ADR 0064 decision 2). */
export type CalendarPeriod = { from: PlainDate; to: PlainDate };

/** The longest period one URL may show; a longer one is cut. */
export const MAX_PERIOD_DAYS = MAX_CALENDAR_DAYS;
/** The list view's span when it is picked from another view. */
const LIST_DAYS = 14;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` as a date, or `undefined` when it is not a real date. */
export function readPlainDate({ value }: { value: string | undefined }): PlainDate | undefined {
  if (!value || !ISO_DATE.test(value)) return undefined;
  const date = parseIsoDate({ value });
  return toIsoDate({ date }) === value ? date : undefined;
}

/** The number of days in the period, at least 1. */
export const spanOf = ({ period }: { period: CalendarPeriod }): number =>
  Math.round(compareDates({ a: period.to, b: period.from }) / 86_400_000) + 1;

export type ReadPeriodInput = {
  from: string | undefined;
  to: string | undefined;
  today: PlainDate;
};

/** The path's period: an invalid date is today, a reversed range swapped, a long one cut. */
export function readCalendarPeriod({ from, to, today }: ReadPeriodInput): CalendarPeriod {
  const a = readPlainDate({ value: from }) ?? today;
  const b = readPlainDate({ value: to }) ?? today;
  const [start, end] = compareDates({ a, b }) <= 0 ? [a, b] : [b, a];
  const cut = addDays({ date: start, days: MAX_PERIOD_DAYS - 1 });
  return { from: start, to: compareDates({ a: end, b: cut }) > 0 ? cut : end };
}

const isWholeMonth = ({ period }: { period: CalendarPeriod }) =>
  period.from.day === 1 &&
  period.to.year === period.from.year &&
  period.to.month === period.from.month &&
  period.to.day === daysInMonth({ date: period.from });

/** The view is derived from the range, never stored: 1 day, 7 days, a whole month, else a list. */
export function viewOf({ period }: { period: CalendarPeriod }): CalendarView {
  const span = spanOf({ period });
  if (span === 1) return "day";
  if (span === 7) return "week";
  return isWholeMonth({ period }) ? "month" : "list";
}

export type PeriodForInput = { view: CalendarView; anchor: PlainDate };

/** The period of `view` around `anchor`: its day, its Monday-first week, its month or two weeks. */
export function periodFor({ view, anchor }: PeriodForInput): CalendarPeriod {
  if (view === "day") return { from: anchor, to: anchor };
  if (view === "week") {
    const from = addDays({ date: anchor, days: -weekdayOf({ date: anchor }) });
    return { from, to: addDays({ date: from, days: 6 }) };
  }
  if (view === "month") {
    const from = { ...anchor, day: 1 };
    return { from, to: { ...anchor, day: daysInMonth({ date: anchor }) } };
  }
  return { from: anchor, to: addDays({ date: anchor, days: LIST_DAYS - 1 }) };
}

/** The day other views center on: today when it is shown, else the first day. */
export function anchorOf({ period, today }: { period: CalendarPeriod; today: PlainDate }) {
  const shown =
    compareDates({ a: today, b: period.from }) >= 0 &&
    compareDates({ a: today, b: period.to }) <= 0;
  return shown ? today : period.from;
}

/** The previous or next period: a month steps by a month, anything else by its own length. */
export function shiftPeriod({ period, step }: { period: CalendarPeriod; step: -1 | 1 }) {
  if (viewOf({ period }) === "month") {
    return periodFor({ view: "month", anchor: addMonths({ date: period.from, months: step }) });
  }
  const days = step * spanOf({ period });
  return { from: addDays({ date: period.from, days }), to: addDays({ date: period.to, days }) };
}

/** Today's period in the same view; a list keeps its length. */
export function todayPeriod({ period, today }: { period: CalendarPeriod; today: PlainDate }) {
  const view = viewOf({ period });
  if (view !== "list") return periodFor({ view, anchor: today });
  return { from: today, to: addDays({ date: today, days: spanOf({ period }) - 1 }) };
}

/** Every day of the period, in order. */
export const periodDays = ({ period }: { period: CalendarPeriod }): PlainDate[] =>
  Array.from({ length: spanOf({ period }) }, (_, days) => addDays({ date: period.from, days }));

/** `/calendar/{from}/{to}`. */
export const periodPath = ({ period }: { period: CalendarPeriod }): string =>
  `/calendar/${toIsoDate({ date: period.from })}/${toIsoDate({ date: period.to })}`;
