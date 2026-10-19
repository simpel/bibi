import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { ArchivePreviewSchema, blockersOf } from "../../shared/archive-preview";
import { archivePhase } from "./archive-phase";
import { TicketPhaseArchiveInputSchema } from "./schema";

export const previewArchiveTicketPhase = defineOperation({
  name: "ticketPhase.archivePreview",
  kind: "query",
  dryRun: true,
  description:
    "Preview archiving a ticket phase without changing anything: how many tickets would move to " +
    "`targetPhaseId`, how many phase grid cells are cleared and every blocker (a ticket that may " +
    "not move, a missing target, the last entry or terminal phase) that would refuse " +
    "`ticketPhase.archive`. Same input as `ticketPhase.archive`.",
  input: TicketPhaseArchiveInputSchema,
  output: ArchivePreviewSchema,
  permission: "pipeline:remove",
  handler: async ({ input, context }) => {
    const moving = await context.db.ticket.count({ where: { phaseId: input.id } });
    const cells = await context.db.phaseStateRule.count({ where: { phaseId: input.id } });
    const archived = await archivePhase({ context, input });
    if (!archived.ok && archived.error.code === "NOT_FOUND") return archived;
    const blockers = archived.ok ? [] : blockersOf({ error: archived.error });
    const targetRequired = moving > 0;
    return ok({ value: { archivable: archived.ok, moving, cells, targetRequired, blockers } });
  },
});
