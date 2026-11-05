import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { archiveConsequences } from "../../shared/archive-consequences";
import { ArchivePreviewSchema, blockersOf } from "../../shared/archive-preview";
import { canView } from "../../shared/can-view";
import { archiveStatus } from "./archive-status";
import { OrderStatusArchiveInputSchema, OrderStatusSchema } from "./schema";

export const archiveOrderStatus = defineOperation({
  name: "orderStatus.archive",
  kind: "command",
  description:
    "Archive an order status (statuses are never deleted). A status that holds orders needs " +
    "`targetStatusId`: its orders move there through the normal move checks (transition and " +
    "flags), all or none. Its transitions are removed. The last entry or closing status cannot " +
    "be archived (CONFLICT), nor a status predefined orders start in. Its status grid cells are cleared.",
  input: OrderStatusArchiveInputSchema,
  output: OrderStatusSchema,
  permission: "pipeline:delete",
  handler: ({ input, context }) => archiveStatus({ context, input }),
  consequences: async ({ input, context }) => {
    // Only counted for a caller who may view them (ADR 0050, feature scope).
    const moving = canView({ context, feature: "order" })
      ? await context.db.order.count({ where: { statusId: input.id } })
      : 0;
    const cells = await context.db.statusStateRule.count({ where: { statusId: input.id } });
    const target = input.targetStatusId
      ? await context.db.orderStatus.findFirst({ where: { id: input.targetStatusId } })
      : null;
    return archiveConsequences({ moving, cells, target: target?.name ?? null, rows: "orders" });
  },
});

export const previewArchiveOrderStatus = defineOperation({
  name: "orderStatus.archivePreview",
  kind: "query",
  dryRun: true,
  description:
    "Preview archiving an order status without changing anything: how many orders would move to " +
    "`targetStatusId`, how many status grid cells are cleared and every blocker (an order that may " +
    "not move, a missing target, the last entry or closing status) that would refuse " +
    "`orderStatus.archive`. Same input as `orderStatus.archive`.",
  input: OrderStatusArchiveInputSchema,
  output: ArchivePreviewSchema,
  permission: "pipeline:delete",
  handler: async ({ input, context }) => {
    const moving = await context.db.order.count({ where: { statusId: input.id } });
    const cells = await context.db.statusStateRule.count({ where: { statusId: input.id } });
    const archived = await archiveStatus({ context, input });
    if (!archived.ok && archived.error.code === "NOT_FOUND") return archived;
    const blockers = archived.ok ? [] : blockersOf({ error: archived.error });
    const targetRequired = moving > 0;
    return ok({ value: { archivable: archived.ok, moving, cells, targetRequired, blockers } });
  },
});
