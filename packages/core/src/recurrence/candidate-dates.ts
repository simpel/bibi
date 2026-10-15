import { monthDates } from "./month-dates";
import { addDays, addMonths, compareDates, type PlainDate, weekdayOf } from "./plain-date";
import { type RecurrenceRule, WEEKDAY_CODES } from "./recurrence-rule-schema";

export type CandidateDatesInput = {
  rule: RecurrenceRule;
  startDate: PlainDate;
  /** Exclusive: no period starting on or after this date is generated. */
  horizon: PlainDate;
};

function weekDates({
  rule,
  weekStart,
  startDate,
}: {
  rule: RecurrenceRule;
  weekStart: PlainDate;
  startDate: PlainDate;
}): PlainDate[] {
  const weekdays = rule.byDay
    ? rule.byDay.map((code) => WEEKDAY_CODES.indexOf(code as (typeof WEEKDAY_CODES)[number]))
    : [weekdayOf({ date: startDate })];
  return [...new Set(weekdays)]
    .sort((a, b) => a - b)
    .map((weekday) => addDays({ date: weekStart, days: weekday }));
}

function periodDates({
  rule,
  startDate,
  period,
}: Omit<CandidateDatesInput, "horizon"> & { period: number }): {
  periodStart: PlainDate;
  dates: PlainDate[];
} {
  const step = period * rule.interval;
  if (rule.freq === "WEEKLY") {
    const weekStart = addDays({ date: startDate, days: step * 7 - weekdayOf({ date: startDate }) });
    return { periodStart: weekStart, dates: weekDates({ rule, weekStart, startDate }) };
  }
  const month = addMonths({ date: startDate, months: step });
  const dates = monthDates({
    month,
    byDay: rule.byDay,
    byMonthDay: rule.byMonthDay,
    defaultDay: startDate.day,
  });
  return { periodStart: month, dates };
}

/**
 * The rule's dates on or after `startDate`, in order, one period (week or month) at a time.
 * Weeks start on Monday (WKST=MO). Stops at the first period that starts on or after `horizon`.
 */
export function* candidateDates({
  rule,
  startDate,
  horizon,
}: CandidateDatesInput): Generator<PlainDate> {
  for (let period = 0; ; period++) {
    const { periodStart, dates } = periodDates({ rule, startDate, period });
    if (compareDates({ a: periodStart, b: horizon }) >= 0) return;
    for (const date of dates) {
      if (compareDates({ a: date, b: startDate }) >= 0) yield date;
    }
  }
}
