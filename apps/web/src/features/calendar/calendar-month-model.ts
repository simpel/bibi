import { type PlainDate, weekdayOf } from "@bibi/core/schemas";
import type { ListDay } from "./calendar-list-model";

/** One day of the month grid: its date and its blocks, as the list shows them. */
export type MonthCell = { date: PlainDate; day: ListDay };

/** A slot before the 1st or after the last day, keyed by its place. */
export type MonthBlank = { blank: string };

export type MonthWeeksInput = { dates: PlainDate[]; days: ListDay[] };

/** The month as Monday-first weeks, with blanks before the 1st and after the last day. */
export function monthWeeks({ dates, days }: MonthWeeksInput): (MonthCell | MonthBlank)[][] {
  const first = dates[0];
  if (!first) return [];
  const cells: (MonthCell | MonthBlank)[] = Array.from(
    { length: weekdayOf({ date: first }) },
    (_, index) => ({ blank: `before-${index}` }),
  );
  dates.forEach((date, index) => {
    const day = days[index];
    if (day) cells.push({ date, day });
  });
  while (cells.length % 7 !== 0) cells.push({ blank: `after-${cells.length}` });
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}
