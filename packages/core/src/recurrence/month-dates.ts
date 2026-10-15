import { addDays, daysInMonth, type PlainDate, weekdayOf } from "./plain-date";
import { BY_DAY_PATTERN, WEEKDAY_CODES } from "./recurrence-rule-schema";

type MonthInput = { month: PlainDate };

/** Every date in the month that falls on `weekday` (0 = Monday). */
function weekdaysInMonth({ month, weekday }: MonthInput & { weekday: number }): PlainDate[] {
  const first = { ...month, day: 1 };
  const firstMatch = addDays({ date: first, days: (weekday - weekdayOf({ date: first }) + 7) % 7 });
  const dates: PlainDate[] = [];
  for (let day = firstMatch.day; day <= daysInMonth({ date: month }); day += 7) {
    dates.push({ ...month, day });
  }
  return dates;
}

/** `1TU` → first Tuesday, `-1FR` → last Friday, `WE` → every Wednesday. Missing nth → none. */
function datesForByDay({ month, token }: MonthInput & { token: string }): PlainDate[] {
  const [, ordinal, code] = BY_DAY_PATTERN.exec(token) ?? [];
  const weekday = WEEKDAY_CODES.indexOf(code as (typeof WEEKDAY_CODES)[number]);
  const all = weekdaysInMonth({ month, weekday });
  if (!ordinal) return all;
  const n = Number(ordinal);
  const match = n > 0 ? all[n - 1] : all[all.length + n];
  return match ? [match] : [];
}

export type MonthDatesInput = MonthInput & {
  byDay?: string[] | undefined;
  byMonthDay?: number[] | undefined;
  /** Day of the month used when neither BYDAY nor BYMONTHDAY is set. */
  defaultDay: number;
};

/** The rule's dates within one month, sorted. Days the month does not have are skipped. */
export function monthDates({ month, byDay, byMonthDay, defaultDay }: MonthDatesInput): PlainDate[] {
  const last = daysInMonth({ date: month });
  const days = byDay
    ? byDay.flatMap((token) => datesForByDay({ month, token })).map((date) => date.day)
    : (byMonthDay ?? [defaultDay]).filter((day) => day <= last);
  return [...new Set(days)].sort((a, b) => a - b).map((day) => ({ ...month, day }));
}
