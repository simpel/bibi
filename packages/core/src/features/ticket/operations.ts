import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { subjectIdFilter } from "../assignment/subject-filter";
import { changeTicketPhase } from "./change-phase-operation";
import { createTicketFromTemplate } from "./create-from-template-operation";
import { expireTicketHolds } from "./expire-holds-operation";
import { exportTicket } from "./export-operation";
import { ticketListWhere } from "./list-where";
import {
  TicketIdInputSchema,
  TicketListInputSchema,
  TicketListOutputSchema,
  TicketSchema,
} from "./schema";
import { loadTicket, toTicketDto } from "./to-ticket-dto";
import { createTicket, updateTicket } from "./write-operations";

export const listTickets = defineOperation({
  name: "ticket.list",
  kind: "query",
  description:
    "List the organization's tickets, newest first. Filter by customer, type, phase, assignee, " +
    "follower (assignment.list) or a window over the desired period (`from`/`to`).",
  input: TicketListInputSchema,
  output: TicketListOutputSchema,
  permission: "ticket:read",
  handler: async ({ input, context }) => {
    const { assigneeId, followerId } = input;
    const ids = await subjectIdFilter({ context, subjectType: "TICKET", assigneeId, followerId });
    const rows = await context.db.ticket.findMany({
      where: { ...ticketListWhere({ input }), ...ids },
      orderBy: [{ reference: "desc" }, { id: "desc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toTicketDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getTicket = defineOperation({
  name: "ticket.get",
  kind: "query",
  description:
    "Get one ticket by id: reference number, type and its field values, customer, contact, " +
    "desired period, headcount, budget and phase (with the reason of the last move). " +
    "Who answers for it: assignment.list.",
  input: TicketIdInputSchema,
  output: TicketSchema,
  permission: "ticket:read",
  handler: async ({ input, context }) => {
    const ticket = await loadTicket({ context, id: input.id });
    return ticket ? ok({ value: ticket }) : notFound({ entity: "Ticket" });
  },
});

export const ticketOperations = [
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  changeTicketPhase,
  createTicketFromTemplate,
  exportTicket,
  expireTicketHolds,
];
