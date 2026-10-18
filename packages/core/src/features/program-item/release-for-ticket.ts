import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { releaseProgramItem } from "./reserve";
import { toProgramItemDto } from "./to-program-item-dto";

export type ReleaseForTicketInput = { context: OperationContext; ticketId: string };

/**
 * Releases the occupancy of every active program item of the ticket, so a closed ticket no
 * longer blocks the items its run schedule held. The program items themselves stay as history.
 */
export async function releaseProgramItemsOfTicket({
  context,
  ticketId,
}: ReleaseForTicketInput): Promise<Result<true>> {
  const rows = await context.db.programItem.findMany({
    where: { ticketId },
    select: { id: true },
  });
  for (const { id } of rows) {
    const released = await releaseProgramItem({ context, id });
    if (!released.ok) return released;
  }
  return ok({ value: true });
}

/**
 * Archives every active program item of the ticket (one audit row each) and releases the
 * occupancy it held. Used when the ticket itself is archived.
 */
export async function archiveProgramItemsOfTicket({
  context,
  ticketId,
}: ReleaseForTicketInput): Promise<Result<true>> {
  const rows = await context.db.programItem.findMany({ where: { ticketId } });
  for (const row of rows) {
    const archived = await context.db.programItem.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({
      entityType: "programItem",
      entityId: row.id,
      before: toProgramItemDto({ row }),
      after: toProgramItemDto({ row: archived }),
    });
    const released = await releaseProgramItem({ context, id: row.id });
    if (!released.ok) return released;
  }
  return ok({ value: true });
}
