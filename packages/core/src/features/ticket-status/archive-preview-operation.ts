import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { ArchivePreviewSchema, blockersOf } from "../../shared/archive-preview";
import { archiveStatus } from "./archive-status";
import { TicketStatusArchiveInputSchema } from "./schema";

export const previewArchiveTicketStatus = defineOperation({
  name: "ticketStatus.archivePreview",
  kind: "query",
  dryRun: true,
  description:
    "Preview archiving a ticket status without changing anything: how many tickets would move to " +
    "`targetStatusId`, how many status grid cells are cleared and every blocker (a ticket that may " +
    "not move, a missing target, the last entry or closing status) that would refuse " +
    "`ticketStatus.archive`. Same input as `ticketStatus.archive`.",
  input: TicketStatusArchiveInputSchema,
  output: ArchivePreviewSchema,
  permission: "pipeline:delete",
  handler: async ({ input, context }) => {
    const moving = await context.db.ticket.count({ where: { statusId: input.id } });
    const cells = await context.db.statusStateRule.count({ where: { statusId: input.id } });
    const archived = await archiveStatus({ context, input });
    if (!archived.ok && archived.error.code === "NOT_FOUND") return archived;
    const blockers = archived.ok ? [] : blockersOf({ error: archived.error });
    const targetRequired = moving > 0;
    return ok({ value: { archivable: archived.ok, moving, cells, targetRequired, blockers } });
  },
});
