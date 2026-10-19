import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { archiveLinesOfTicket } from "../line/release-for-ticket";
import type { TicketDto } from "./schema";
import { TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";

export type ArchiveTicketInput = { context: OperationContext; ticket: TicketDto };

/**
 * The single place that archives a ticket (#145, #166): its lines are archived, and their
 * holds go by trigger (ADR 0053), so no room stays blocked for a ticket that is gone. Audited per row. A ticket archive operation and the customer
 * cascade (`customer.archive`) both go through here.
 */
export async function archiveTicket({
  context,
  ticket,
}: ArchiveTicketInput): Promise<Result<TicketDto>> {
  const program = await archiveLinesOfTicket({ context, ticketId: ticket.id });
  if (!program.ok) return program;
  const row = await context.db.ticket.update({
    where: { id: ticket.id },
    data: { status: "ARCHIVED" },
    include: TICKET_INCLUDE,
  });
  await archiveRecords({ context, ids: [ticket.id] });
  const after = toTicketDto({ row });
  context.recordChange({ entityType: "ticket", entityId: ticket.id, before: ticket, after });
  return ok({ value: after });
}
