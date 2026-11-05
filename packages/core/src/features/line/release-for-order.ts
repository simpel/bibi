import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { syncAllocations } from "../line-allocation/sync-allocations";
import { releaseLineStates } from "./release-line-states";
import { LINE_INCLUDE, toLineRecord } from "./to-line-record";

export type ReleaseForOrderInput = { context: OperationContext; orderId: string };

/**
 * Releases every active line of the order when it enters a closing status (ADR 0044): each line
 * with a state moves to its item type's released state (ignoring the grid, overrides and
 * transitions). The holds follow by trigger (ADR 0053): an order in a closing status holds
 * nothing, so a closed order no longer blocks its items. The lines themselves stay as history.
 */
export const releaseLinesOfOrder = ({
  context,
  orderId,
}: ReleaseForOrderInput): Promise<Result<true>> => releaseLineStates({ context, orderId });

/**
 * Archives every active line of the order (one audit row each) with its allocations; their
 * holds go by trigger.
 * Used when the order itself is archived.
 */
export async function archiveLinesOfOrder({
  context,
  orderId,
}: ReleaseForOrderInput): Promise<Result<true>> {
  const rows = await context.db.line.findMany({ where: { orderId }, include: LINE_INCLUDE });
  for (const row of rows) {
    const archived = await context.db.line.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
      include: LINE_INCLUDE,
    });
    await archiveRecords({ context, ids: [row.id] });
    await syncAllocations({ context, lineId: row.id });
    context.recordChange({
      entityType: "line",
      entityId: row.id,
      before: toLineRecord({ row }),
      after: toLineRecord({ row: archived }),
    });
  }
  return ok({ value: true });
}
