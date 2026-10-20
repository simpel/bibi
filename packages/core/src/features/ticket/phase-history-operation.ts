import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import {
  TicketPhaseHistoryInputSchema,
  TicketPhaseHistoryOutputSchema,
} from "./phase-history-schema";
import { phaseWarnings } from "./phase-warnings";

export const ticketPhaseHistory = defineOperation({
  name: "ticket.phaseHistory",
  kind: "query",
  description:
    "The ticket's phase history, oldest first (ADR 0054): every phase it entered, from which " +
    "phase, why (reason), what made the move (MANUAL, QUOTE_EVENT, TEMPLATE or SYSTEM), when " +
    "and by whom. Time in a phase is the gap to the next entry. `warnings` lists facts that " +
    "contradict the phase, e.g. an accepted quote while the ticket is in an earlier phase.",
  input: TicketPhaseHistoryInputSchema,
  output: TicketPhaseHistoryOutputSchema,
  permission: "ticket:read",
  handler: async ({ input: { ticketId }, context }) => {
    const ticket = await context.db.ticket.findFirst({
      where: { id: ticketId },
      select: { id: true, phaseId: true },
    });
    if (!ticket) return notFound({ entity: "Ticket" });
    const items = await context.db.ticketPhaseChange.findMany({
      where: { ticketId },
      orderBy: { seq: "asc" },
      select: {
        ...{ id: true, ticketId: true, fromPhaseId: true, toPhaseId: true, reason: true },
        ...{ trigger: true, changedAt: true, changedBy: true },
      },
    });
    const warnings = await phaseWarnings({ context, ticketId, phaseId: ticket.phaseId });
    return ok({ value: { items, warnings } });
  },
});
