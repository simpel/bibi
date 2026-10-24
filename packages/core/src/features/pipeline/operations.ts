import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { loadTicketCards } from "./load-cards";
import { PipelineBoardInputSchema, PipelineBoardSchema } from "./schema";

const DAY_MS = 86_400_000;

export const pipelineBoard = defineOperation({
  name: "pipeline.board",
  kind: "query",
  description:
    "The pipeline board (ADR 0041, 0043): one column per active ticket status in the " +
    "organization's order, closing statuses last as closed lanes, and one card per ticket in its " +
    "status's column. Filter by assignee or type. Tickets in closing statuses appear only for " +
    "`closedWithinDays` days. A card names its customer by id only (customer.get or " +
    "customer.list resolve it); its held and booked line counts are null without program:read.",
  input: PipelineBoardInputSchema,
  output: PipelineBoardSchema,
  permission: "ticket:read",
  // The cards are tickets; a card's customer is only its id (ADR 0050, feature scope).
  entityType: "ticket",
  handler: async ({ input, context }) => {
    const since = new Date(Date.now() - input.closedWithinDays * DAY_MS);
    const statuses = await context.db.ticketStatus.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    const columns = statuses.map((ticketStatus) => ({
      id: ticketStatus.id,
      title: ticketStatus.name,
      color: ticketStatus.color,
      requiresReason: ticketStatus.requiresReason,
      closed: ticketStatus.closes,
    }));
    const cards = await loadTicketCards({ context, input, since });
    return ok({
      value: {
        columns: [...columns.filter((c) => !c.closed), ...columns.filter((c) => c.closed)],
        cards,
      },
    });
  },
});

export const pipelineOperations = [pipelineBoard];
