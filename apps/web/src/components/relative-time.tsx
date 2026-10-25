"use client";

import { RelativeTime as RelativeTimeView } from "@bibi/ui";
import { useFormatter, useNow, useTimeZone } from "next-intl";
import { exactTime, relativeTime } from "@/lib/time/relative-time";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

export type RelativeTimeProps = {
  instant: Date | string;
};

/** A relative time ("3 days ago") with the exact date and time in a tooltip (ADR 0064). */
export function RelativeTime({ instant }: RelativeTimeProps) {
  const format = useFormatter();
  const timeZone = useTimeZone() ?? "UTC";
  const now = useNow();
  const dateTimeFormat = useDateTimeFormat();
  const date = new Date(instant);
  return (
    <RelativeTimeView
      dateTime={date.toISOString()}
      label={relativeTime({ format, instant: date, now })}
      exact={exactTime({ format: dateTimeFormat, instant: date, timeZone })}
    />
  );
}
