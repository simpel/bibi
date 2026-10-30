import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { archiveConsequences } from "../../shared/archive-consequences";
import { ArchivePreviewSchema, blockersOf } from "../../shared/archive-preview";
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
