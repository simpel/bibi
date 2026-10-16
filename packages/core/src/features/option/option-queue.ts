import type { Option } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { toOptionDto } from "./to-option-dto";

type QueueContext = Pick<OperationContext, "db" | "recordChange">;

export type QueuePeriod = { itemId: string; startsAt: Date; endsAt: Date };

export type LockQueueInput = { context: Pick<OperationContext, "db">; itemId: string };

/**
 * Serialises queue changes on one item: the row lock on the item is held until the command's
 * transaction ends, so two concurrent options on the same item cannot both count themselves first.
 */
export async function lockOptionQueue({ context, itemId }: LockQueueInput): Promise<void> {
  await context.db.item.updateMany({
    where: { id: itemId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    data: { updatedAt: new Date() },
  });
}

type ActiveOverlapInput = { context: Pick<OperationContext, "db"> } & QueuePeriod;

/** Active options on the item whose period overlaps `[startsAt, endsAt)`, in queue order. */
export const activeOverlapping = ({ context, itemId, startsAt, endsAt }: ActiveOverlapInput) =>
  context.db.option.findMany({
    where: { itemId, optionStatus: "ACTIVE", startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    orderBy: { sequence: "asc" },
  });

export type NextRankInput = ActiveOverlapInput;

/** The rank of a new option: the number of active overlapping options + 1 (ADR 0022). */
export async function nextRank({ context, itemId, startsAt, endsAt }: NextRankInput) {
  return (await activeOverlapping({ context, itemId, startsAt, endsAt })).length + 1;
}

const overlaps = ({ a, b }: { a: Option; b: Option }) =>
  a.startsAt < b.endsAt && b.startsAt < a.endsAt;

/** 1 + the active options on the item that overlap `option` and were placed before it. */
const rankOf = ({ option, queue }: { option: Option; queue: readonly Option[] }) =>
  1 +
  queue.filter((other) => other.sequence < option.sequence && overlaps({ a: other, b: option }))
    .length;

export type RerankInput = { context: QueueContext } & QueuePeriod;

/**
 * Moves the options behind a period that left the queue (released, expired or converted) up:
 * every active option overlapping it gets its rank recounted, and each change is audited.
 */
export async function rerankQueue({ context, ...period }: RerankInput): Promise<void> {
  const affected = await activeOverlapping({ context, ...period });
  if (affected.length === 0) return;
  const queue = await activeOverlapping({
    context,
    itemId: period.itemId,
    startsAt: new Date(Math.min(...affected.map((option) => option.startsAt.getTime()))),
    endsAt: new Date(Math.max(...affected.map((option) => option.endsAt.getTime()))),
  });
  for (const option of affected) {
    const rank = rankOf({ option, queue });
    if (rank === option.rank) continue;
    const row = await context.db.option.update({ where: { id: option.id }, data: { rank } });
    const before = toOptionDto({ row: option });
    context.recordChange({
      entityType: "option",
      entityId: row.id,
      before,
      after: toOptionDto({ row }),
    });
  }
}
