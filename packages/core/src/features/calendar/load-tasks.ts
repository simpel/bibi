import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { nowOf } from "../../time/now";
import { isOverdue, TASK_ITEM_ORDER } from "../task/to-task-dto";
import type { CalendarTask } from "./task-schema";

type Context = Pick<OperationContext, "db" | "permissions" | "now">;

export type LoadTasksInput = {
  context: Context;
  from: Date;
  to: Date;
  /** Only tasks linked to this order (the calendar's order filter). */
  orderId?: string | undefined;
};

/**
 * The active tasks due in `[from, to)` (ADR 0117, 0120), by due time; a task without one is not
 * on the calendar. A view field of the task feature (ADR 0071): empty without `task:read`.
 */
export async function loadCalendarTasks({
  context,
  from,
  to,
  orderId,
}: LoadTasksInput): Promise<CalendarTask[]> {
  if (!canView({ context, feature: "task" })) return [];
  const rows = await context.db.task.findMany({
    where: { ...(orderId ? { orderId } : {}), dueAt: { gte: from, lt: to } },
    orderBy: [{ dueAt: "asc" }, { id: "asc" }],
    select: {
      ...{ id: true, dueAt: true, orderId: true, customerId: true, doneAt: true },
      entityType: { select: { name: true } },
      items: { select: { itemId: true }, orderBy: TASK_ITEM_ORDER },
    },
  });
  const now = nowOf({ context });
  return rows.flatMap(({ entityType, doneAt, items, dueAt, ...row }) =>
    dueAt
      ? [
          {
            ...row,
            dueAt,
            typeName: entityType.name,
            itemIds: items.map((item) => item.itemId),
            done: doneAt !== null,
            overdue: isOverdue({ task: { dueAt, doneAt }, now }),
          },
        ]
      : [],
  );
}
