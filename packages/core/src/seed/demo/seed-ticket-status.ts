import { ok } from "../../errors/result";
import { changeTicketStatus } from "../../features/ticket/change-status-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { atDay } from "./seed-clock";
import { missing } from "./seed-fields";
import { seedTicketQuote } from "./seed-ticket-quote";
import type { DemoTicket } from "./ticket-types";

export type MoveStatusInput = {
  context: ExecuteContext;
  ticket: DemoTicket;
  ticketId: string;
  now: Date;
};

/**
 * Brings the new ticket to its status in the spec (ADR 0043). A status with a quote event is
 * reached through the ticket's quote (`quote.send`, `quote.accept`); any other through
 * `ticket.changeStatus`.
 */
export async function moveStatus({ context: live, ticket, ticketId, now }: MoveStatusInput) {
  // A past event closes on its own day (ADR 0064 clock), so the history has real months.
  const context = atDay({ context: live, now, day: ticket.day <= 0 ? ticket.day : undefined });
  // A ticket made from a predefined ticket already starts in its status.
  if (!ticket.status || ticket.template) return ok({ value: true });
  const ticketStatus = await context.db.ticketStatus.findFirst({
    where: { name: ticket.status },
  });
  if (!ticketStatus) return missing({ what: `ticket status ${ticket.status}` });
  if (ticket.won) {
    // ADR 0079: a won ticket reaches its closing status through an accepted quote.
    const accepted = await seedTicketQuote({
      context,
      ticket,
      ticketId,
      event: "QUOTE_ACCEPTED",
      now,
    });
    if (!accepted.ok) return accepted;
  } else if (ticketStatus.event) {
    return seedTicketQuote({ context, ticket, ticketId, event: ticketStatus.event, now });
  }
  const input = { ticketId, statusId: ticketStatus.id, reason: ticket.reason };
  return execute({ operation: changeTicketStatus, input, context });
}
