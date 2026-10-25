import type { DateTimeFormat } from "@bibi/core/schemas";
import type { useFormatter } from "next-intl";

type Formatter = ReturnType<typeof useFormatter>;

export type RelativeTimeInput = {
  format: Formatter;
  instant: Date;
  now: Date;
};

export type ExactTimeInput = {
  format: DateTimeFormat;
  instant: Date;
  timeZone: string;
};

/** "3 days ago" for `instant` as seen at `now`. The one place that calls `format.relativeTime`. */
export function relativeTime({ format, instant, now }: RelativeTimeInput): string {
  return format.relativeTime(instant, now);
}

/** The exact date and time of `instant` in `timeZone`, with the zone's name: the tooltip of a relative time. */
export function exactTime({ format, instant, timeZone }: ExactTimeInput): string {
  return format.dateTime({ instant, timeZone, weekday: "long", zoneName: true });
}
