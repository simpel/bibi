import { defineOperation } from "../../operations/define-operation";
import { archiveConsequences } from "../../shared/archive-consequences";
import { canView } from "../../shared/can-view";
import { archivePhase } from "./archive-phase";
import { TicketPhaseArchiveInputSchema, TicketPhaseSchema } from "./schema";

export const archiveTicketPhase = defineOperation({
  name: "ticketPhase.archive",
  kind: "command",
  description:
    "Archive a ticket phase (phases are never deleted). A phase that holds tickets needs " +
    "`targetPhaseId`: its tickets move there through the normal move checks (transition and " +
    "flags), all or none. Its transitions are removed. The last entry or terminal phase cannot " +
    "be archived (CONFLICT), nor a phase predefined tickets start in. Its phase grid cells are cleared.",
  input: TicketPhaseArchiveInputSchema,
  output: TicketPhaseSchema,
  permission: "pipeline:delete",
  handler: ({ input, context }) => archivePhase({ context, input }),
  consequences: async ({ input, context }) => {
    // Only counted for a caller who may view them (ADR 0050, feature scope).
    const moving = canView({ context, feature: "ticket" })
      ? await context.db.ticket.count({ where: { phaseId: input.id } })
      : 0;
    const cells = await context.db.phaseStateRule.count({ where: { phaseId: input.id } });
    const target = input.targetPhaseId
      ? await context.db.ticketPhase.findFirst({ where: { id: input.targetPhaseId } })
      : null;
    return archiveConsequences({ moving, cells, target: target?.name ?? null, rows: "tickets" });
  },
});
