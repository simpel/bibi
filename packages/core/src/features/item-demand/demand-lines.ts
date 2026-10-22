import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { syncAllocations } from "../line-allocation/sync-allocations";

export type ResyncDemandLinesInput = { context: OperationContext; itemId: string };

/**
 * After a demand of `itemId` changes, the lines that have not ended and book the item, or hold it
 * as an allocated unit (a chained demand), get their allocations re-derived (ADR 0059, as the
 * holds trigger does for configuration changes, ADR 0053 rule 8). A mandatory demand with no
 * free unit refuses the change with CONFLICT.
 */
export async function resyncDemandLines({
  context,
  itemId,
}: ResyncDemandLinesInput): Promise<Result<true>> {
  const lines = await context.db.line.findMany({
    where: {
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      AND: [
        {
          OR: [{ itemId }, { allocations: { some: { unitId: itemId, status: "ACTIVE" } } }],
        },
      ],
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  for (const line of lines) {
    const synced = await syncAllocations({ context, lineId: line.id });
    if (!synced.ok) return synced;
  }
  return ok({ value: true });
}
