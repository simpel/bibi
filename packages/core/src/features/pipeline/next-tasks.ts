import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { nowOf } from "../../time/now";
import { isOverdue } from "../task/to-task-dto";
import type { NextTask } from "./next-task-schema";

type Context = Pick<OperationContext, "db" | "permissions" | "now">;

/**
 * Each order's next open task (ADR 0117): the earliest open, active task linked to it, in one
 * query. A view field of the task feature: empty without `task:read` (ADR 0071).
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
    where: { orderId: { in: [...orderIds] }, doneAt: null },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      ...{ id: true, orderId: true, startsAt: true, endsAt: true, doneAt: true },
      entityType: { select: { name: true, taskShape: true } },
    },
  });
  const now = nowOf({ context });
  for (const row of rows) {
    if (!row.orderId || next.has(row.orderId)) continue;
    next.set(row.orderId, {
      ...{ id: row.id, startsAt: row.startsAt, endsAt: row.endsAt },
      typeName: row.entityType.name,
      shape: row.entityType.taskShape ?? (row.endsAt ? "MEETING" : "DEADLINE"),
      overdue: isOverdue({ task: row, now }),
    });
  }
  return next;
}
