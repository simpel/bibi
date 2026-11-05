import type { StatusChangeTrigger } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { nowOf } from "../../time/now";

/** `include` for the newest status change of an order: when it entered its status, and why (ADR 0054). */
export const LATEST_STATUS_CHANGE = {
  statusChanges: {
    select: { changedAt: true, reason: true },
    orderBy: { seq: "desc" },
    take: 1,
  },
} as const;

export type LatestStatusChange = {
  statusChanges: readonly { changedAt: Date; reason: string | null }[];
};

export type RecordStatusChangeInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "actor" | "now">;
  orderId: string;
  /** The status the change was decided from; null for the first row of a new order. */
  fromStatusId: string | null;
  toStatusId: string;
  reason?: string | null | undefined;
  trigger: StatusChangeTrigger;
};

/**
 * Appends one row to the order's status history (ADR 0054). The trigger on insert sets
 * `Order.statusId` (`domain_history.sql`); it fails with CONFLICT when the order left
 * `fromStatusId` in the meantime. The only way an order's status changes.
 */
export async function recordStatusChange({
  context,
  orderId,
  fromStatusId,
  toStatusId,
  reason,
  trigger,
}: RecordStatusChangeInput): Promise<void> {
  await context.db.orderStatusChange.create({
    data: {
      organizationId: context.organizationId,
      orderId,
      fromStatusId,
      toStatusId,
      reason: reason ?? null,
      trigger,
      changedBy: context.actor.userId,
      changedAt: nowOf({ context }),
    },
  });
}
