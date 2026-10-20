import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadTicketPhase, toTicketPhaseDto, WITH_TRANSITIONS } from "./load-ticket-phase";
import {
  TicketPhaseIdInputSchema,
  TicketPhaseListInputSchema,
  TicketPhaseListOutputSchema,
  TicketPhaseSchema,
} from "./schema";

export const listTicketPhases = defineOperation({
  name: "ticketPhase.list",
  kind: "query",
  description:
    "List the organization's ticket phases in board order, each with its flags (entry, " +
    "terminal, requiresReason, requiresAssignee, invoiceable) and the phases a ticket may move " +
    "to from it (`transitionsTo`).",
  input: TicketPhaseListInputSchema,
  output: TicketPhaseListOutputSchema,
  permission: "pipeline:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.ticketPhase.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      include: WITH_TRANSITIONS,
      ...pageArgs(input),
    });
    const phases = rows.map((row) => toTicketPhaseDto({ row }));
    return ok({ value: paginate({ rows: phases, limit: input.limit }) });
  },
});

export const getTicketPhase = defineOperation({
  name: "ticketPhase.get",
  kind: "query",
  description: "Get one ticket phase by id, with its flags and the phases it may move to.",
  input: TicketPhaseIdInputSchema,
  output: TicketPhaseSchema,
  permission: "pipeline:read",
  handler: async ({ input, context }) => {
    const phase = await loadTicketPhase({ context, id: input.id });
    return phase ? ok({ value: phase }) : notFound({ entity: "Ticket phase" });
  },
});
