/** A calendar date without time or time zone. `month` is 1–12. */
export type PlainDate = { year: number; month: number; day: number };

type DateInput = { date: PlainDate };

function toUtcMs({ date }: DateInput): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function fromUtcMs({ ms }: { ms: number }): PlainDate {
  const value = new Date(ms);
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

/** ISO weekday index: 0 = Monday … 6 = Sunday. */
export function weekdayOf({ date }: DateInput): number {
  return (new Date(toUtcMs({ date })).getUTCDay() + 6) % 7;
}

export function addDays({ date, days }: DateInput & { days: number }): PlainDate {
  return fromUtcMs({ ms: toUtcMs({ date }) + days * 86_400_000 });
}

/** First day of the month `months` after the month of `date`. */
export function addMonths({ date, months }: DateInput & { months: number }): PlainDate {
  const index = date.year * 12 + (date.month - 1) + months;
  return { year: Math.floor(index / 12), month: (index % 12) + 1, day: 1 };
}

export function daysInMonth({ date }: DateInput): number {
  return new Date(Date.UTC(date.year, date.month, 0)).getUTCDate();
}

/** Negative when `a` is before `b`, zero when equal. */
export function compareDates({ a, b }: { a: PlainDate; b: PlainDate }): number {
  return toUtcMs({ date: a }) - toUtcMs({ date: b });
}

/** `YYYY-MM-DD` → PlainDate. The caller validates the format. */
export function parseIsoDate({ value }: { value: string }): PlainDate {
  const [year, month, day] = value.split("-").map(Number);
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 };
}

export function toIsoDate({ date }: DateInput): string {
  return new Date(toUtcMs({ date })).toISOString().slice(0, 10);
}
