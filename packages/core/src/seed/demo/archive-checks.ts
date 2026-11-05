import { previewArchiveItemState } from "../../features/item-state/archive-preview-operation";
import { previewArchiveOrderStatus } from "../../features/order-status/archive-operations";
import { loadAllOrderStatuses } from "../../features/order-status/load-order-status";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoArchiveInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0043: previewing the removal of a status that holds orders, with a target, reports that
 * all of its orders move and nothing blocks; the preview changes nothing. An organization
 * without such a status (or state) has nothing to check.
 */
async function statusFailures({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const statuses = await context.db.orderStatus.findMany({
    where: { status: "ACTIVE", entry: false, closes: false },
  });
  const all = await loadAllOrderStatuses({ context });
  const gated = new Set(
    (
      await context.db.orderStatusGate.findMany({
        where: { key: { in: ["REASON", "ACCEPTED_QUOTE"] } },
      })
    ).map(({ toStatusId }) => toStatusId),
  );
  for (const orderStatus of statuses) {
    const orders = await context.db.order.count({ where: { statusId: orderStatus.id } });
    // Orders cannot be moved into a status that only a quote event enters (ADR 0043), and a
    // REASON or ACCEPTED_QUOTE gate (ADR 0067, 0076) would block the move.
    // Forward only: a line's state cannot move back (ADR 0044), and movement is free (ADR 0076).
    const allowed = all.find(({ id }) => id === orderStatus.id)?.transitionsTo ?? [];
    const forward = all.filter((s) => allowed.includes(s.id) && s.position > orderStatus.position);
    const target = forward.find(({ id }) => !gated.has(id))?.id;
    const templates = await context.db.orderTemplate.count({
      where: { statusId: orderStatus.id },
    });
    if (orders === 0 || templates > 0 || !target) continue;
    const input = { id: orderStatus.id, targetStatusId: target };
    const result = await execute({ operation: previewArchiveOrderStatus, input, context });
    if (!result.ok) return [`${org.slug}: archive preview of ${orderStatus.name} failed`];
    const { archivable, moving, blockers } = result.value;
    if (archivable && moving === orders) return [];
    return [`${org.slug}: removing "${orderStatus.name}" is blocked: ${blockers.join("; ")}`];
  }
  return [];
}

/** ADR 0044: the same for an item state that lines use, with another state of the type. */
async function stateFailures({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const states = await context.db.itemState.findMany({
    where: { status: "ACTIVE", initial: false },
  });
  for (const state of states) {
    const lines = await context.db.line.count({ where: { stateId: state.id } });
    if (lines === 0) continue;
    const target = await context.db.itemState.findFirst({
      where: { entityTypeId: state.entityTypeId, initial: true },
    });
    if (!target) continue;
    const input = { id: state.id, targetStateId: target.id };
    const result = await execute({ operation: previewArchiveItemState, input, context });
    if (!result.ok) return [`${org.slug}: archive preview of ${state.name} failed`];
    if (result.value.moving === lines) return [];
    return [`${org.slug}: removing "${state.name}" would move ${result.value.moving} lines`];
  }
  return [];
}

/** Removing a populated status or state with a target is previewed and allowed (#275). */
export async function checkDemoArchive({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const input = { context, org };
  return [...(await statusFailures(input)), ...(await stateFailures(input))];
}
