import type { DateTimeFormat } from "@bibi/core/schemas";

type When = Date | string | null;

export type DesiredPeriodInput = {
  /** A ticket, or its JSON form from a tool result (dates as ISO strings). */
  ticket: { desiredStartsAt: When; desiredEndsAt: When };
  format: DateTimeFormat;
};

const toDate = ({ value }: { value: When }) => (value === null ? null : new Date(value));

/** The desired dates as a range, a single date or "–" when none is given. */
export function desiredPeriod({ ticket, format }: DesiredPeriodInput): string {
  const start = toDate({ value: ticket.desiredStartsAt });
  const end = toDate({ value: ticket.desiredEndsAt });
  if (start && end) return format.dateTimeRange({ start, end });
  const one = start ?? end;
  return one ? format.dateTime({ instant: one }) : "–";
}
