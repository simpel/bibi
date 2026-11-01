import { type Bucket, bucketOf } from "./buckets";
import type { Trend, TrendPoint } from "./trend-schema";

/** An amount at an instant: an invoice sent, a payment received, a refund made (negative). */
export type Fact = { at: Date; amount: number };

const total = ({ facts }: { facts: readonly Fact[] }) =>
  facts.reduce((sum, fact) => sum + fact.amount, 0);

/** The facts summed per bucket; facts outside the buckets are left out. */
export function sumSeries({
  buckets,
  facts,
}: {
  buckets: readonly Bucket[];
  facts: readonly Fact[];
}): TrendPoint[] {
  const sums = new Map(buckets.map((bucket) => [bucket.key, 0]));
  for (const fact of facts) {
    const bucket = bucketOf({ buckets, instant: fact.at });
    if (bucket) sums.set(bucket.key, (sums.get(bucket.key) ?? 0) + fact.amount);
  }
  return buckets.map((bucket) => ({ bucket: bucket.key, value: sums.get(bucket.key) ?? 0 }));
}

export type SumTrendInput = {
  buckets: readonly Bucket[];
  facts: readonly Fact[];
  /** The facts of the previous range of equal length. */
  previous: readonly Fact[];
};

/** A sum over the range (ADR 0086): per bucket, in total, and the previous range's total. */
export function sumTrend({ buckets, facts, previous }: SumTrendInput): Trend {
  const series = sumSeries({ buckets, facts });
  const current = series.reduce((sum, point) => sum + point.value, 0);
  return { series, current, previous: total({ facts: previous }) };
}

export type SnapshotTrendInput = {
  buckets: readonly Bucket[];
  now: Date;
  /** The figure as it stood at an instant, rebuilt from history. */
  valueAt: (input: { instant: Date }) => number;
};

/**
 * A snapshot over the range (ADR 0086): the value at each bucket's end, up to now (later buckets
 * are not known yet); `previous` is the value at the range's start.
 */
export function snapshotTrend({ buckets, now, valueAt }: SnapshotTrendInput): Trend {
  const first = buckets[0];
  const known = buckets.filter((bucket) => bucket.start.getTime() <= now.getTime());
  const series = known.map((bucket) => ({
    bucket: bucket.key,
    value: valueAt({ instant: bucket.end.getTime() > now.getTime() ? now : bucket.end }),
  }));
  const current = series.at(-1)?.value ?? valueAt({ instant: now });
  const previous =
    first && first.start.getTime() <= now.getTime() ? valueAt({ instant: first.start }) : null;
  return { series, current, previous };
}
