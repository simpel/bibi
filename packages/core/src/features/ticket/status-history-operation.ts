import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import {
  TicketStatusHistoryInputSchema,
  TicketStatusHistoryOutputSchema,
} from "./status-history-schema";
import { statusWarnings } from "./status-warnings";

export const ticketStatusHistory = defineOperation({
  name: "ticket.statusHistory",
  kind: "query",
  description:
    "The ticket's status history, oldest first (ADR 0054): every status it entered, from which " +
    "status, why (reason), what made the move (MANUAL, QUOTE_EVENT, TEMPLATE or SYSTEM), when " +
    "and by whom. Time in a status is the gap to the next entry. `warnings` lists facts that " +
    "contradict the status, e.g. an accepted quote while the ticket is in an earlier status.",
  input: TicketStatusHistoryInputSchema,
  output: TicketStatusHistoryOutputSchema,
  permission: "ticket:read",
  handler: async ({ input: { ticketId }, context }) => {
    const ticket = await context.db.ticket.findFirst({
      where: { id: ticketId },
      select: { id: true, statusId: true },
    });
    if (!ticket) return notFound({ entity: "Ticket" });
    const items = await context.db.ticketStatusChange.findMany({
      where: { ticketId },
      orderBy: { seq: "asc" },
      select: {
        ...{ id: true, ticketId: true, fromStatusId: true, toStatusId: true, reason: true },
        ...{ trigger: true, changedAt: true, changedBy: true },
      },
    });
    const warnings = await statusWarnings({ context, ticketId, statusId: ticket.statusId });
    return ok({ value: { items, warnings } });
  },
});
