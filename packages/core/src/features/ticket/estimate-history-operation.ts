import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import {
  TicketEstimateHistoryInputSchema,
  TicketEstimateHistoryOutputSchema,
} from "./estimate-history-schema";

export const ticketEstimateHistory = defineOperation({
  name: "ticket.estimateHistory",
  kind: "query",
  description:
    "The ticket's value estimates, oldest first (ADR 0074): every estimated value excl. VAT it " +
    "was given (ticket.create, ticket.update), when and by whom. The first entry is the first " +
    "estimate and the last the current one; compare them with the accepted quote's total to see " +
    "how far off the estimates were.",
  input: TicketEstimateHistoryInputSchema,
  output: TicketEstimateHistoryOutputSchema,
  permission: "ticket:read",
  handler: async ({ input: { ticketId }, context }) => {
    const ticket = await context.db.ticket.findFirst({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!ticket) return notFound({ entity: "Ticket" });
    const items = await context.db.ticketEstimate.findMany({
      where: { ticketId },
      orderBy: { seq: "asc" },
      select: { id: true, ticketId: true, valueMinor: true, changedAt: true, changedBy: true },
    });
    return ok({ value: { items } });
  },
});
