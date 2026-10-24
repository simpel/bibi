import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { TicketExportInputSchema, TicketExportOutputSchema } from "./export-schema";
import { loadTicket } from "./to-ticket-dto";

/** Version of the exported document; bumped on every breaking change (ADR 0024). */
export const TICKET_EXPORT_SCHEMA_VERSION = 1;

export const exportTicket = defineOperation({
  name: "ticket.export",
  kind: "query",
  description:
    "Export a ticket for handover outside the system (ADR 0024) as a versioned json document: " +
    "the ticket with its own field values and its status. Returns the file name, media type " +
    "and content.",
  input: TicketExportInputSchema,
  output: TicketExportOutputSchema,
  permission: "ticket:write",
  handler: async ({ input, context }) => {
    const ticket = await loadTicket({ context, id: input.id });
    if (!ticket) return notFound({ entity: "Ticket" });
    const ticketStatus = await context.db.ticketStatus.findFirstOrThrow({
      where: { id: ticket.statusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { id: true, name: true, closes: true },
    });
    const { inboundAddress: _address, ...exported } = ticket;
    const document = {
      schemaVersion: TICKET_EXPORT_SCHEMA_VERSION,
      ticket: exported,
      ticketStatus,
    };
    const content = JSON.stringify(document, null, 2);
    return ok({
      value: {
        filename: `ticket-${ticket.reference}.json`,
        mime: "application/json",
        size: Buffer.byteLength(content),
        content,
      },
    });
  },
});
