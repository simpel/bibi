import { fromZonedParts, toZonedParts } from "@bibi/core/schemas";
import { DEFAULT_TIME_ZONE } from "@bibi/i18n";

export type ToLocalInputValueInput = { date: Date; timeZone?: string };

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** A `datetime-local` input value (`YYYY-MM-DDTHH:mm`) as the wall time in the app's time zone. */
export function toLocalInputValue({
  date,
  timeZone = DEFAULT_TIME_ZONE,
}: ToLocalInputValueInput): string {
  const { date: day, time } = toZonedParts({ instant: date, timeZone });
  const [year, month, dayOfMonth] = [day.year, day.month, day.day].map((value) => pad({ value }));
  return `${year}-${month}-${dayOfMonth}T${pad({ value: time.hour })}:${pad({ value: time.minute })}`;
}

export type FromLocalInputValueInput = { value: string; timeZone?: string };

const LOCAL_VALUE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/;

/** A `datetime-local` value read as a wall time in the app's time zone; empty or invalid → undefined. */
export function fromLocalInputValue({
  value,
  timeZone = DEFAULT_TIME_ZONE,
}: FromLocalInputValueInput): Date | undefined {
  const match = LOCAL_VALUE.exec(value.trim());
  if (!match) return undefined;
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0));
  return fromZonedParts({
    date: { year: year ?? 0, month: month ?? 1, day: day ?? 1 },
    time: { hour: hour ?? 0, minute: minute ?? 0, second: second ?? 0 },
    timeZone,
  });
}
