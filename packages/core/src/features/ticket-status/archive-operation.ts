import { defineOperation } from "../../operations/define-operation";
import { archiveConsequences } from "../../shared/archive-consequences";
import { canView } from "../../shared/can-view";
import { archiveStatus } from "./archive-status";
import { TicketStatusArchiveInputSchema, TicketStatusSchema } from "./schema";

export const archiveTicketStatus = defineOperation({
  name: "ticketStatus.archive",
  kind: "command",
  description:
    "Archive a ticket status (statuses are never deleted). A status that holds tickets needs " +
    "`targetStatusId`: its tickets move there through the normal move checks (transition and " +
    "flags), all or none. Its transitions are removed. The last entry or closing status cannot " +
    "be archived (CONFLICT), nor a status predefined tickets start in. Its status grid cells are cleared.",
  input: TicketStatusArchiveInputSchema,
  output: TicketStatusSchema,
  permission: "pipeline:delete",
  handler: ({ input, context }) => archiveStatus({ context, input }),
  consequences: async ({ input, context }) => {
    // Only counted for a caller who may view them (ADR 0050, feature scope).
    const moving = canView({ context, feature: "ticket" })
      ? await context.db.ticket.count({ where: { statusId: input.id } })
      : 0;
    const cells = await context.db.statusStateRule.count({ where: { statusId: input.id } });
    const target = input.targetStatusId
      ? await context.db.ticketStatus.findFirst({ where: { id: input.targetStatusId } })
      : null;
    return archiveConsequences({ moving, cells, target: target?.name ?? null, rows: "tickets" });
  },
});
