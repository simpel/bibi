import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadAllTicketStatuses, loadTicketStatus } from "./load-ticket-status";
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
    "closing, invoiceable), the statuses a ticket may move to from it (`transitionsTo`; every " +
    "other status unless `restrictsNext`) and the gates on those moves (`transitionGates`: " +
    "REASON, ASSIGNEE, ACCEPTED_QUOTE). `gatesInto` lists the gates on moves into a status by source.",
  input: TicketStatusListInputSchema,
  output: TicketStatusListOutputSchema,
  permission: "pipeline:read",
  handler: async ({ input, context }) => {
    const page = await context.db.ticketStatus.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true },
      ...pageArgs(input),
    });
    // Free statuses allow every other status, so each one is derived from the full set.
    const all = await loadAllTicketStatuses({ context });
    const statuses = page.flatMap(({ id }) => all.find((status) => status.id === id) ?? []);
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
