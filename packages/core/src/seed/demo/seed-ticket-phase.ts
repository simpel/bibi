import { ok } from "../../errors/result";
import { changeTicketPhase } from "../../features/ticket/change-phase-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import { seedTicketQuote } from "./seed-ticket-quote";
import type { DemoTicket } from "./ticket-types";

export type MovePhaseInput = {
  context: ExecuteContext;
  ticket: DemoTicket;
  ticketId: string;
  now: Date;
};

/**
 * Brings the new ticket to its phase in the spec (ADR 0043). A phase with a quote event is
 * reached through the ticket's quote (`quote.send`, `quote.accept`); any other through
 * `ticket.changePhase`.
 */
export async function movePhase({ context, ticket, ticketId, now }: MovePhaseInput) {
  // A ticket made from a predefined ticket already starts in its phase.
  if (!ticket.phase || ticket.template) return ok({ value: true });
  const phase = await context.db.ticketPhase.findFirst({ where: { name: ticket.phase } });
  if (!phase) return missing({ what: `ticket phase ${ticket.phase}` });
  if (phase.event) {
    return seedTicketQuote({ context, ticket, ticketId, event: phase.event, now });
  }
  const input = { ticketId, phaseId: phase.id, reason: ticket.reason };
  return execute({ operation: changeTicketPhase, input, context });
}
