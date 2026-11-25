import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { nowOf } from "../../time/now";
import { isOverdue } from "../task/to-task-dto";
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
 * The active tasks in `[from, to)` (ADR 0117): a meeting that overlaps it, a deadline due in it,
 * by start. A view field of the task feature (ADR 0071): empty without `task:read`.
 */
export async function loadCalendarTasks({
  context,
  from,
  to,
  orderId,
}: LoadTasksInput): Promise<CalendarTask[]> {
  if (!canView({ context, feature: "task" })) return [];
  const rows = await context.db.task.findMany({
    where: {
      ...(orderId ? { orderId } : {}),
      startsAt: { lt: to },
      OR: [{ endsAt: { gt: from } }, { endsAt: null, startsAt: { gte: from } }],
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      ...{ id: true, startsAt: true, endsAt: true, itemId: true, orderId: true },
      ...{ customerId: true, doneAt: true },
      entityType: { select: { name: true, taskShape: true } },
    },
  });
  const now = nowOf({ context });
  return rows.map(({ entityType, doneAt, ...row }) => ({
    ...row,
    typeName: entityType.name,
    shape: entityType.taskShape ?? (row.endsAt ? "MEETING" : "DEADLINE"),
    done: doneAt !== null,
    overdue: isOverdue({ task: { ...row, doneAt }, now }),
  }));
}
