import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import {
  draftTicketFromMessage,
  type ExtractFn,
  type ExtractInput,
  setExtract,
} from "../ticket-draft/operations";
import { changeTicketStatus } from "./change-status-operation";
import { createTicketFromTemplate } from "./create-from-template-operation";
import { ticketEstimateHistory } from "./estimate-history-operation";
import { expireTicketHolds } from "./expire-holds-operation";
import { exportTicket } from "./export-operation";
import { loadTicketPage } from "./list-page";
import { TicketListInputSchema, TicketListOutputSchema } from "./list-schema";
import { previewTicketLines } from "./preview-lines-operation";
import { TicketIdInputSchema, TicketSchema } from "./schema";
import { ticketStatusHistory } from "./status-history-operation";
import { loadTicket } from "./to-ticket-dto";
import { createTicket, updateTicket } from "./write-operations";

export const listTickets = defineOperation({
  name: "ticket.list",
  kind: "query",
  description:
    "List the organization's tickets, newest first. Filter by customer, type, status, assignee, " +
    "follower (assignment.list) or a window over the desired period (`from`/`to`); search with " +
    "`q` (reference, customer, contact or note) and order with `sort`/`direction`. Page with " +
    "`cursor`, or with `page` to get numbered pages and the `total` count.",
  input: TicketListInputSchema,
  output: TicketListOutputSchema,
  permission: "ticket:read",
  handler: async ({ input, context }) => ok({ value: await loadTicketPage({ input, context }) }),
});

export const getTicket = defineOperation({
  name: "ticket.get",
  kind: "query",
  description:
    "Get one ticket by id: reference number, type and its field values, customer, contact, " +
    "desired period, headcount, budget and status (with the reason of the last move). " +
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
  changeTicketStatus,
  createTicketFromTemplate,
  previewTicketLines,
  exportTicket,
  expireTicketHolds,
  ticketStatusHistory,
  ticketEstimateHistory,
  draftTicketFromMessage,
];

export type { ExtractFn, ExtractInput };
// The draft read from a message starts a ticket (ADR 0084): public here with the port it reads through.
export { draftTicketFromMessage, previewTicketLines, setExtract, ticketEstimateHistory };
