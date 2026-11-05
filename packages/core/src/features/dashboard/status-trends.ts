import type { OperationContext } from "../../operations/types";
import type { Bucket } from "../../trend/buckets";
import { snapshotTrend } from "../../trend/series";
import type { Trend } from "../../trend/trend-schema";

type Context = Pick<OperationContext, "db">;

type Change = { orderId: string; toStatusId: string; changedAt: Date };

/** Orders per status at each instant (ascending), replaying the status history once. */
function countsAt({
  changes,
  instants,
}: {
  changes: readonly Change[];
  instants: readonly number[];
}) {
  const statusOf = new Map<string, string>();
  const result = new Map<number, Map<string, number>>();
  let next = 0;
  for (const instant of instants) {
    while (next < changes.length && (changes[next]?.changedAt.getTime() ?? Infinity) <= instant) {
      const change = changes[next] as Change;
      statusOf.set(change.orderId, change.toStatusId);
      next += 1;
    }
    const counts = new Map<string, number>();
    for (const status of statusOf.values()) counts.set(status, (counts.get(status) ?? 0) + 1);
    result.set(instant, counts);
  }
  return result;
}

export type StatusTrendsInput = { context: Context; buckets: readonly Bucket[]; now: Date };

/**
 * Open orders per status at each bucket's end (ADR 0086), rebuilt from `OrderStatusChange`
 * (ADR 0054) for the orders that are active today. Returns the trend of one status.
 */
export async function statusTrends({
  context,
  buckets,
  now,
}: StatusTrendsInput): Promise<(input: { statusId: string }) => Trend> {
  const last = buckets.at(-1)?.end ?? now;
  const changes = await context.db.orderStatusChange.findMany({
    where: { changedAt: { lte: last < now ? last : now }, order: { status: "ACTIVE" } },
    orderBy: [{ changedAt: "asc" }, { seq: "asc" }],
    select: { orderId: true, toStatusId: true, changedAt: true },
  });
  const instants = [
    ...buckets.flatMap((bucket) => [bucket.start.getTime(), bucket.end.getTime()]),
    now.getTime(),
  ].sort((a, b) => a - b);
  const counts = countsAt({ changes, instants: [...new Set(instants)] });
  return ({ statusId }) =>
    snapshotTrend({
      buckets,
      now,
      valueAt: ({ instant }) => counts.get(instant.getTime())?.get(statusId) ?? 0,
    });
}
