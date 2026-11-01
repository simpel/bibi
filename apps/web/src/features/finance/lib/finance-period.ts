import {
  addDays,
  addMonths,
  type PlainDate,
  PlainDateStringSchema,
  parseIsoDate,
  toIsoDate,
} from "@bibi/core/schemas";

/** The longest period one overview covers (core's `MAX_FINANCE_MONTHS`). */
export const MAX_PERIOD_MONTHS = 24;

/** Inclusive plain days, `YYYY-MM-DD`, as they stand in the path (ADR 0064). */
export type Period = { from: string; to: string };

type DateInput = { date: PlainDate };

const monthIndex = ({ date }: DateInput) => date.year * 12 + date.month - 1;

const lastDayOfMonth = ({ date }: DateInput): PlainDate =>
  addDays({ date: addMonths({ date, months: 1 }), days: -1 });

/** How many calendar months the period touches. */
export function periodMonths({ from, to }: Period): number {
  return (
    monthIndex({ date: parseIsoDate({ value: to }) }) -
    monthIndex({ date: parseIsoDate({ value: from }) }) +
    1
  );
}

/** Two valid days in order, covering at most `MAX_PERIOD_MONTHS` months. */
export function isValidPeriod({ from, to }: Period): boolean {
  if (!PlainDateStringSchema.safeParse(from).success) return false;
  if (!PlainDateStringSchema.safeParse(to).success) return false;
  return from <= to && periodMonths({ from, to }) <= MAX_PERIOD_MONTHS;
}

const periodOf = ({ from, to }: { from: PlainDate; to: PlainDate }): Period => ({
  from: toIsoDate({ date: from }),
  to: toIsoDate({ date: to }),
});

export type LastMonthsInput = { today: PlainDate; months: number };

/** The last `months` whole months, ending with the month of `today`. */
export function lastMonthsPeriod({ today, months }: LastMonthsInput): Period {
  return periodOf({
    from: addMonths({ date: today, months: 1 - months }),
    to: lastDayOfMonth({ date: today }),
  });
}

/** January to December of `today`'s year. */
export function yearPeriod({ today }: { today: PlainDate }): Period {
  return periodOf({
    from: { year: today.year, month: 1, day: 1 },
    to: { year: today.year, month: 12, day: 31 },
  });
}
