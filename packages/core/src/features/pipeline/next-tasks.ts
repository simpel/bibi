import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { nowOf } from "../../time/now";
import { isOverdue } from "../task/to-task-dto";
import type { NextTask } from "./next-task-schema";

type Context = Pick<OperationContext, "db" | "permissions" | "now">;

/**
 * Each order's next open task (ADR 0117, 0120): the open, active task linked to it that is due
 * first, in one query; a task without a due time is never next. A view field of the task feature: empty without `task:read` (ADR 0071).
 */
export async function nextTasks({
  context,
  orderIds,
}: {
  context: Context;
  orderIds: readonly string[];
}): Promise<Map<string, NonNullable<NextTask>>> {
  const next = new Map<string, NonNullable<NextTask>>();
  if (orderIds.length === 0 || !canView({ context, feature: "task" })) return next;
  const rows = await context.db.task.findMany({
    where: { orderId: { in: [...orderIds] }, doneAt: null, dueAt: { not: null } },
    orderBy: [{ dueAt: "asc" }, { id: "asc" }],
    select: {
      ...{ id: true, orderId: true, dueAt: true, doneAt: true },
      entityType: { select: { name: true } },
    },
  });
  const now = nowOf({ context });
  for (const row of rows) {
    if (!row.orderId || !row.dueAt || next.has(row.orderId)) continue;
    next.set(row.orderId, {
      ...{ id: row.id, dueAt: row.dueAt },
      typeName: row.entityType.name,
      overdue: isOverdue({ task: row, now }),
    });
  }
  return next;
}
