import type { PhaseChangeTrigger } from "@okazi/db";
import type { OperationContext } from "../../operations/types";

/** `include` for the newest phase change of a ticket: when it entered its phase, and why (ADR 0054). */
export const LATEST_PHASE_CHANGE = {
  phaseChanges: {
    select: { changedAt: true, reason: true },
    orderBy: { seq: "desc" },
    take: 1,
  },
} as const;

export type LatestPhaseChange = {
  phaseChanges: readonly { changedAt: Date; reason: string | null }[];
};

export type RecordPhaseChangeInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "actor">;
  ticketId: string;
  /** The phase the change was decided from; null for the first row of a new ticket. */
  fromPhaseId: string | null;
  toPhaseId: string;
  reason?: string | null | undefined;
  trigger: PhaseChangeTrigger;
};

/**
 * Appends one row to the ticket's phase history (ADR 0054). The trigger on insert sets
 * `Ticket.phaseId` (`domain_history.sql`); it fails with CONFLICT when the ticket left
 * `fromPhaseId` in the meantime. The only way a ticket's phase changes.
 */
export async function recordPhaseChange({
  context,
  ticketId,
  fromPhaseId,
  toPhaseId,
  reason,
  trigger,
}: RecordPhaseChangeInput): Promise<void> {
  await context.db.ticketPhaseChange.create({
    data: {
      organizationId: context.organizationId,
      ticketId,
      fromPhaseId,
      toPhaseId,
      reason: reason ?? null,
      trigger,
      changedBy: context.actor.userId,
    },
  });
}
