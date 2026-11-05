import type { OrderStatus } from "@bibi/db";
import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { unplaceStatus } from "../board/status-placement";
import { clearStatusCells } from "../status-grid/cell-lifecycle";
import { moveOrder } from "../order/move-order";
import { ORDER_INCLUDE, toOrderDto } from "../order/to-order-dto";
import { checkMinimumConfiguration, serializeStatusChanges } from "./flag-rules";
import { loadAllOrderStatuses, loadOrderStatus, toOrderStatusDto } from "./load-order-status";
import type { OrderStatusArchiveInput } from "./schema";

type MoveAllInput = {
  context: OperationContext;
  id: string;
  targetStatusId: string | undefined;
  reason: string | undefined;
};

async function loadTarget({ context, id, targetStatusId }: Omit<MoveAllInput, "reason">) {
  const target = targetStatusId
    ? await context.db.orderStatus.findFirst({ where: { id: targetStatusId } })
    : null;
  if (target && target.id !== id) return ok({ value: target });
  const message = "Choose another active status for the status's orders";
  return invalid({ message, issues: [{ path: "targetStatusId", message }] });
}

/**
 * Moves every active order out of the status into the target through the normal move checks
 * (ADR 0043). Any blocked order refuses the whole archive, with every blocker listed.
 */
async function moveOrdersOut({
  context,
  id,
  targetStatusId,
  reason,
}: MoveAllInput): Promise<Result<true>> {
  const rows = await context.db.order.findMany({
    where: { statusId: id },
    include: ORDER_INCLUDE,
  });
  if (rows.length === 0) return ok({ value: true });
  const target = await loadTarget({ context, id, targetStatusId });
  if (!target.ok) return target;
  const blockers: AppErrorIssue[] = [];
  for (const row of rows) {
    const to: OrderStatus = target.value;
    const moved = await moveOrder({
      context,
      before: toOrderDto({ row }),
      to,
      reason,
      trigger: "SYSTEM",
    });
    if (!moved.ok) blockers.push(...moved.error.issues);
  }
  if (blockers.length === 0) return ok({ value: true });
  return conflict({ message: "Some orders cannot move to the target status", issues: blockers });
}

type DetachInput = { context: OperationContext; id: string };

/**
 * Removes every move rule that names the archived status (ADR 0076): transitions into it and the
 * gates into it or from it. Each status whose allowed or gated moves changed is audited.
 */
async function detachIncoming({ context, id }: DetachInput) {
  const befores = await loadAllOrderStatuses({ context });
  await context.db.orderStatusTransition.deleteMany({
    where: { OR: [{ toStatusId: id }, { fromStatusId: id }] },
  });
  await context.db.orderStatusGate.deleteMany({
    where: { OR: [{ toStatusId: id }, { fromStatusId: id }] },
  });
  const afters = await loadAllOrderStatuses({ context });
  for (const after of afters) {
    const before = befores.find((candidate) => candidate.id === after.id);
    if (!before || after.id === id || JSON.stringify(before) === JSON.stringify(after)) continue;
    context.recordChange({ entityId: after.id, before, after });
  }
}

export type ArchiveStatusInput = { context: OperationContext; input: OrderStatusArchiveInput };

/**
 * The whole archive (ADR 0043): checks, order moves, transitions and grid cells. Shared by
 * `orderStatus.archive` and its dry run `orderStatus.archivePreview`.
 */
export async function archiveStatus({ context, input }: ArchiveStatusInput) {
  const { id, targetStatusId, reason } = input;
  await serializeStatusChanges({ context });
  const before = await loadOrderStatus({ context, id });
  if (!before) return notFound({ entity: "Order status" });
  const templates = await context.db.orderTemplate.count({ where: { statusId: id } });
  if (templates > 0) {
    return conflict({ message: `${templates} predefined orders start in this status` });
  }
  const statuses = await loadAllOrderStatuses({ context });
  const minimum = checkMinimumConfiguration({ statuses, id, after: null });
  if (!minimum.ok) return minimum;
  const moved = await moveOrdersOut({ context, id, targetStatusId, reason });
  if (!moved.ok) return moved;
  await detachIncoming({ context, id });
  await clearStatusCells({ context, statusId: id });
  await unplaceStatus({ context, statusId: id });
  // An archived status gives up its quote event (ADR 0043): another status can take it.
  const data = { status: "ARCHIVED", event: null } as const;
  const row = await context.db.orderStatus.update({ where: { id }, data });
  const after = { ...before, ...row, transitionsTo: [], transitionGates: [], gatesInto: [] };
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
}
