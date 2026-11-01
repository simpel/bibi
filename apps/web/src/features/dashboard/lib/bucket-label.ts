import type { BucketSize, DateTimeFormat } from "@bibi/core/schemas";
import { plainDayText } from "@/lib/time/plain-day";

export type BucketLabelInput = {
  size: BucketSize;
  timeZone: string;
  dates: DateTimeFormat;
  /** `dashboard.trend.weekOf`: "Week of {date}". */
  weekOf: (values: { date: string }) => string;
  /** `YYYY-MM` → the month's short name. */
  monthLabel: (input: { month: string }) => string;
};

/** A bucket's first day as the trend tooltip writes it: the day, its week or its month. */
export function bucketLabelOf({ size, timeZone, dates, weekOf, monthLabel }: BucketLabelInput) {
  return ({ bucket }: { bucket: string }): string => {
    if (size === "MONTH") return monthLabel({ month: bucket.slice(0, 7) });
    const day = plainDayText({ day: bucket, timeZone, dates });
    return size === "WEEK" ? weekOf({ date: day }) : day;
  };
}
