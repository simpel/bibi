import type { DateRangePreset } from "../date-picker/date-range-panel";
import { addDays } from "./calendar-dates";
import type { CalendarLabels } from "./calendar-labels";

/** A day key as noon UTC: the calendar runs in UTC, so no zone moves the day. */
export const dateOfDay = ({ day }: { day: string }): Date => new Date(`${day}T12:00:00Z`);

export const dayOfDate = ({ date }: { date: Date }): string => date.toISOString().slice(0, 10);

const monthsBack = ({ today, months }: { today: string; months: number }): string => {
  const date = dateOfDay({ day: today });
  date.setUTCMonth(date.getUTCMonth() - months);
  return addDays({ date: dayOfDate({ date }), days: 1 });
};

export type RangePresetsInput = { today: string; labels: CalendarLabels["rangePresets"] };

/** The last 7 and 30 days and the last 3 and 6 months, each ending today. */
export function rangePresets({ today, labels }: RangePresetsInput): DateRangePreset[] {
  const spans = [
    { key: "last7Days", from: addDays({ date: today, days: -6 }) },
    { key: "last30Days", from: addDays({ date: today, days: -29 }) },
    { key: "last3Months", from: monthsBack({ today, months: 3 }) },
    { key: "last6Months", from: monthsBack({ today, months: 6 }) },
  ] as const;
  return spans.map(({ key, from }) => ({
    key,
    label: labels[key],
    range: { from: dateOfDay({ day: from }), to: dateOfDay({ day: today }) },
  }));
}
