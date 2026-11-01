import type { OperationContext } from "../../operations/types";

/** `include` for a ticket's newest estimate: its current estimated value (ADR 0074). */
export const LATEST_ESTIMATE = {
  estimates: { select: { valueMinor: true }, orderBy: { seq: "desc" }, take: 1 },
} as const;

export type LatestEstimate = { estimates: readonly { valueMinor: number | null }[] };

export type RecordEstimateInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "actor">;
  ticketId: string;
  /** The estimate before the change; nothing is recorded when the value is the same. */
  current: number | null;
  /** The new estimate; undefined leaves it unchanged, null clears it. */
  valueMinor: number | null | undefined;
};

/**
 * Appends one row to the ticket's estimate history (ADR 0074) when the value changes. The newest
 * row is the current estimate; there is no column to keep in step.
 */
export async function recordEstimate({
  context,
  ticketId,
  current,
  valueMinor,
}: RecordEstimateInput): Promise<void> {
  if (valueMinor === undefined || valueMinor === current) return;
  await context.db.ticketEstimate.create({
    data: {
      organizationId: context.organizationId,
      ticketId,
      valueMinor,
      changedBy: context.actor.userId,
    },
  });
}
