import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { loadTicketCards } from "./load-cards";
import { PipelineBoardInputSchema, PipelineBoardSchema } from "./schema";

const DAY_MS = 86_400_000;

export const pipelineBoard = defineOperation({
  name: "pipeline.board",
  kind: "query",
  description:
    "The pipeline board (ADR 0041, 0043): one column per active ticket phase in the " +
    "organization's order, terminal phases last as closed lanes, and one card per ticket in its " +
    "phase's column. Filter by assignee or type. Tickets in terminal phases appear only for " +
    "`closedWithinDays` days.",
  input: PipelineBoardInputSchema,
  output: PipelineBoardSchema,
  permission: "ticket:read",
  handler: async ({ input, context }) => {
    const since = new Date(Date.now() - input.closedWithinDays * DAY_MS);
    const phases = await context.db.ticketPhase.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    const columns = phases.map((phase) => ({
      id: phase.id,
      title: phase.name,
      color: phase.color,
      requiresReason: phase.requiresReason,
      closed: phase.terminal,
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
