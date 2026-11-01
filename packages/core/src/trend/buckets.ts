import { addDays, addMonths, compareDates, type PlainDate, toIsoDate } from "../time/plain-date";
import { fromZonedParts } from "../time/zoned-time";
import type { BucketSize } from "./trend-schema";

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };
const DAY_MS = 86_400_000;
const MAX_DAY_BUCKETS = 31;
const MAX_WEEK_DAYS = 184;

/** One point of a trend line: `[start, end)` as instants, keyed by its first day. */
export type Bucket = { key: string; start: Date; end: Date };

export type Range = { from: PlainDate; to: PlainDate };
type ZonedRange = Range & { timeZone: string };

/** Whole days in `[from, to]`, both inclusive. */
export const daysIn = ({ from, to }: Range) => compareDates({ a: to, b: from }) / DAY_MS + 1;

/** The range of equal length that ends the day before `from`. */
export function previousRange({ from, to }: Range): Range {
  const days = daysIn({ from, to });
  return { from: addDays({ date: from, days: -days }), to: addDays({ date: from, days: -1 }) };
}

export const bucketSizeOf = ({ from, to }: Range): BucketSize => {
  const days = daysIn({ from, to });
  return days <= MAX_DAY_BUCKETS ? "DAY" : days <= MAX_WEEK_DAYS ? "WEEK" : "MONTH";
};

/** The first day of the next bucket after `start`, never past the day after `to`. */
function nextStart({ start, size, to }: { start: PlainDate; size: BucketSize; to: PlainDate }) {
  const next =
    size === "DAY"
      ? addDays({ date: start, days: 1 })
      : size === "WEEK"
        ? addDays({ date: start, days: 7 })
        : addMonths({ date: start, months: 1 });
  const after = addDays({ date: to, days: 1 });
  return compareDates({ a: next, b: after }) > 0 ? after : next;
}

/** The range cut into day, week (from `from`) or calendar-month buckets in `timeZone`. */
export function bucketsOf({ from, to, timeZone }: ZonedRange): {
  size: BucketSize;
  buckets: Bucket[];
} {
  const size = bucketSizeOf({ from, to });
  const instant = ({ date }: { date: PlainDate }) =>
    fromZonedParts({ date, time: MIDNIGHT, timeZone });
  const buckets: Bucket[] = [];
  let start = from;
  while (compareDates({ a: start, b: to }) <= 0) {
    const next = nextStart({ start, size, to });
    buckets.push({
      key: toIsoDate({ date: start }),
      start: instant({ date: start }),
      end: instant({ date: next }),
    });
    start = next;
  }
  return { size, buckets };
}

/** The bucket an instant falls in, or undefined outside the range. */
export function bucketOf({ buckets, instant }: { buckets: readonly Bucket[]; instant: Date }) {
  const time = instant.getTime();
  return buckets.find((bucket) => bucket.start.getTime() <= time && time < bucket.end.getTime());
}
