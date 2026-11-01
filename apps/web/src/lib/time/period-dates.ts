import type { DateRange } from "@bibi/ui";
import type { Period } from "@/features/finance/lib/finance-period";

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** A plain day (`YYYY-MM-DD`) as a local calendar date; it carries no zone (ADR 0064). */
export function dateOfDay({ day }: { day: string }): Date | undefined {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return undefined;
  return new Date(year, month - 1, date);
}

export function dayOfDate({ date }: { date: Date }): string {
  return `${date.getFullYear()}-${pad({ value: date.getMonth() + 1 })}-${pad({ value: date.getDate() })}`;
}

export function rangeOfPeriod({ period }: { period: Period }): DateRange {
  return { from: dateOfDay({ day: period.from }), to: dateOfDay({ day: period.to }) };
}

/** A picked range as a period; one picked day is a one-day period, none is empty. */
export function periodOfRange({ range }: { range: DateRange | undefined }): Period {
  const from = range?.from ? dayOfDate({ date: range.from }) : "";
  const to = range?.to ? dayOfDate({ date: range.to }) : from;
  return { from, to };
}
