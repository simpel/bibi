import type { DateTimeFormat } from "@bibi/core/schemas";

type When = Date | string | null;

export type DesiredPeriodInput = {
  /** An order, or its JSON form from a tool result (dates as ISO strings). */
  order: { desiredStartsAt: When; desiredEndsAt: When };
  format: DateTimeFormat;
};

const toDate = ({ value }: { value: When }) => (value === null ? null : new Date(value));

/** The desired dates as a range, a single date or "–" when none is given. */
export function desiredPeriod({ order, format }: DesiredPeriodInput): string {
  const start = toDate({ value: order.desiredStartsAt });
  const end = toDate({ value: order.desiredEndsAt });
  if (start && end) return format.dateTimeRange({ start, end });
  const one = start ?? end;
  return one ? format.dateTime({ instant: one }) : "–";
}

export type DesiredWhen = { preheader?: string; value: string };

/**
 * The desired dates for `KeyFacts`: on one day, the weekday and date go above the times. A
 * range over several days, or no dates, stays one line like `desiredPeriod`.
 */
export function desiredWhen({ order, format }: DesiredPeriodInput): DesiredWhen {
  const start = toDate({ value: order.desiredStartsAt });
  const end = toDate({ value: order.desiredEndsAt });
  const day = (instant: Date) => format.date({ instant, weekday: "short", year: true });
  if (start && end && day(start) === day(end)) {
    return { preheader: day(start), value: format.timeRange({ start, end }) };
  }
  const one = start && !end ? start : end && !start ? end : null;
  if (one) return { preheader: day(one), value: format.time({ instant: one }) };
  return { value: desiredPeriod({ order, format }) };
}
