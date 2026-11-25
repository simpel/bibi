import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { visibleTo } from "../../shared/visible-to";
import type { RawTask } from "./task-sources";
import type { TaskWindow } from "./task-window";

type Context = Pick<OperationContext, "db" | "permissions">;

export type TaskDueInput = { context: Context; userId: string; window: TaskWindow };

/**
 * `TASK_DUE` (ADR 0117): the member's open, active tasks (main assignee) due before today ends,
 * by their end (meeting) or due time (deadline). Overdue ones fall in LATE. Needs `task:read`.
 */
export async function taskDueTasks({ context, userId, window }: TaskDueInput): Promise<RawTask[]> {
  if (!canView({ context, feature: "task" })) return [];
  const assigned = await context.db.assignment.findMany({
    where: { assigneeId: userId, responsibilityId: null, record: { base: "TASK" } },
    select: { recordId: true },
  });
  if (assigned.length === 0) return [];
  const rows = await context.db.task.findMany({
    where: {
      id: { in: assigned.map((row) => row.recordId) },
      doneAt: null,
      OR: [
        { endsAt: { lt: window.todayEnd } },
        { endsAt: null, startsAt: { lt: window.todayEnd } },
      ],
    },
    select: {
      ...{ id: true, orderId: true, startsAt: true, endsAt: true },
      entityType: { select: { name: true } },
      customer: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    kind: "TASK_DUE",
    orderId: row.orderId,
    dueAt: row.endsAt ?? row.startsAt,
    taskId: row.id,
    taskTypeName: row.entityType.name,
    customerName: visibleTo({ context, feature: "customer", value: row.customer.name }),
  }));
}
