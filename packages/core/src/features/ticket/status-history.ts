import type { StatusChangeTrigger } from "@bibi/db";
import type { OperationContext } from "../../operations/types";

/** `include` for the newest status change of a ticket: when it entered its status, and why (ADR 0054). */
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
  context: Pick<OperationContext, "db" | "organizationId" | "actor">;
  ticketId: string;
  /** The status the change was decided from; null for the first row of a new ticket. */
  fromStatusId: string | null;
  toStatusId: string;
  reason?: string | null | undefined;
  trigger: StatusChangeTrigger;
};

/**
 * Appends one row to the ticket's status history (ADR 0054). The trigger on insert sets
 * `Ticket.statusId` (`domain_history.sql`); it fails with CONFLICT when the ticket left
 * `fromStatusId` in the meantime. The only way a ticket's status changes.
 */
export async function recordStatusChange({
  context,
  ticketId,
  fromStatusId,
  toStatusId,
  reason,
  trigger,
}: RecordStatusChangeInput): Promise<void> {
  await context.db.ticketStatusChange.create({
    data: {
      organizationId: context.organizationId,
      ticketId,
      fromStatusId,
      toStatusId,
      reason: reason ?? null,
      trigger,
      changedBy: context.actor.userId,
    },
  });
}
