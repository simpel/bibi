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
