import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { releaseLineStates } from "./release-line-states";
import { LINE_INCLUDE, toLineRecord } from "./to-line-record";

export type ReleaseForTicketInput = { context: OperationContext; ticketId: string };

/**
 * Releases every active line of the ticket when it enters a terminal phase (ADR 0044): each line
 * with a state moves to its item type's released state (ignoring the grid, overrides and
 * transitions). The holds follow by trigger (ADR 0053): a ticket in a terminal phase holds
 * nothing, so a closed ticket no longer blocks its items. The lines themselves stay as history.
 */
export const releaseLinesOfTicket = ({
  context,
  ticketId,
}: ReleaseForTicketInput): Promise<Result<true>> => releaseLineStates({ context, ticketId });

/**
 * Archives every active line of the ticket (one audit row each); their holds go by trigger.
 * Used when the ticket itself is archived.
 */
export async function archiveLinesOfTicket({
  context,
  ticketId,
}: ReleaseForTicketInput): Promise<Result<true>> {
  const rows = await context.db.line.findMany({ where: { ticketId }, include: LINE_INCLUDE });
  for (const row of rows) {
    const archived = await context.db.line.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
      include: LINE_INCLUDE,
    });
    await archiveRecords({ context, ids: [row.id] });
    context.recordChange({
      entityType: "line",
      entityId: row.id,
      before: toLineRecord({ row }),
      after: toLineRecord({ row: archived }),
    });
  }
  return ok({ value: true });
}
