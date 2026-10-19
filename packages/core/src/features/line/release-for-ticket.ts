import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { releaseLineStates } from "./release-line-states";
import { releaseLine } from "./reserve";
import { toLineDto } from "./to-line-dto";

export type ReleaseForTicketInput = { context: OperationContext; ticketId: string };

/**
 * Releases every active line of the ticket when it enters a terminal phase (ADR 0044): each line
 * with a state moves to its item type's released state (ignoring the grid, overrides and
 * transitions), and the occupancy of every line is released, so a closed ticket no longer blocks
 * the items it held. The lines themselves stay as history.
 */
export async function releaseLinesOfTicket({
  context,
  ticketId,
}: ReleaseForTicketInput): Promise<Result<true>> {
  const states = await releaseLineStates({ context, ticketId });
  if (!states.ok) return states;
  const rows = await context.db.line.findMany({
    where: { ticketId },
    select: { id: true },
  });
  for (const { id } of rows) {
    const released = await releaseLine({ context, id });
    if (!released.ok) return released;
  }
  return ok({ value: true });
}

/**
 * Archives every active line of the ticket (one audit row each) and releases the
 * occupancy it held. Used when the ticket itself is archived.
 */
export async function archiveLinesOfTicket({
  context,
  ticketId,
}: ReleaseForTicketInput): Promise<Result<true>> {
  const rows = await context.db.line.findMany({ where: { ticketId } });
  for (const row of rows) {
    const archived = await context.db.line.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
    });
    await archiveRecords({ context, ids: [row.id] });
    context.recordChange({
      entityType: "line",
      entityId: row.id,
      before: toLineDto({ row }),
      after: toLineDto({ row: archived }),
    });
    const released = await releaseLine({ context, id: row.id });
    if (!released.ok) return released;
  }
  return ok({ value: true });
}
