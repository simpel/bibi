import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadTicketStatus, toTicketStatusDto, WITH_TRANSITIONS } from "./load-ticket-status";
import {
  TicketStatusIdInputSchema,
  TicketStatusListInputSchema,
  TicketStatusListOutputSchema,
  TicketStatusSchema,
} from "./schema";

export const listTicketStatuses = defineOperation({
  name: "ticketStatus.list",
  kind: "query",
  description:
    "List the organization's ticket statuses in board order, each with its flags (entry, " +
    "closing, requiresReason, requiresAssignee, requiresAcceptedQuote, invoiceable) and the " +
    "statuses a ticket may move " +
    "to from it (`transitionsTo`).",
  input: TicketStatusListInputSchema,
  output: TicketStatusListOutputSchema,
  permission: "pipeline:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.ticketStatus.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      include: WITH_TRANSITIONS,
      ...pageArgs(input),
    });
    const statuses = rows.map((row) => toTicketStatusDto({ row }));
    return ok({ value: paginate({ rows: statuses, limit: input.limit }) });
  },
});

export const getTicketStatus = defineOperation({
  name: "ticketStatus.get",
  kind: "query",
  description: "Get one ticket status by id, with its flags and the statuses it may move to.",
  input: TicketStatusIdInputSchema,
  output: TicketStatusSchema,
  permission: "pipeline:read",
  handler: async ({ input, context }) => {
    const ticketStatus = await loadTicketStatus({ context, id: input.id });
    return ticketStatus ? ok({ value: ticketStatus }) : notFound({ entity: "Ticket status" });
  },
});
