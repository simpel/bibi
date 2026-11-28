import { TASK_STATUS_WHERE } from "../../features/task/task-status";
import { defineReconciliation, type ReconcileContext } from "./reconcile";

/** One task as the rule reads it. */
type TaskStatusRow = {
  id: string;
  orderId: string | null;
  statusId: string | null;
  open: boolean;
};

/** Every task, archived or not: an archived one keeps its status too (ADR 0121). */
async function readTasks({ context }: ReconcileContext): Promise<TaskStatusRow[]> {
  const rows = await context.db.task.findMany({
    where: { status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true, orderId: true, statusId: true, doneAt: true, status: true },
  });
  return rows.map(({ doneAt, status, ...row }) => ({
    ...row,
    open: doneAt === null && status === "ACTIVE",
  }));
}

/**
 * `Task.statusId` against the rule that writes it (ADR 0121): no task with an order has a
 * status, and every open, active task without an order sits in a status that holds tasks
 * (flagged, active, not closing), unless no status holds tasks; then it has none.
 */
export const taskStatusReconciliation = defineReconciliation({
  name: "task-status",
  rebuild: readTasks,
  compare: async ({ context, rebuilt }) => {
    const holding = await context.db.orderStatus.findMany({
      where: TASK_STATUS_WHERE,
      select: { id: true },
    });
    const valid = new Set(holding.map((row) => row.id));
    return rebuilt.flatMap((task) => {
      if (task.orderId && task.statusId)
        return [`task ${task.id} has an order and status ${task.statusId}`];
      if (task.orderId || !task.open) return [];
      if (valid.size === 0)
        return task.statusId
          ? [`task ${task.id} has status ${task.statusId}, none holds tasks`]
          : [];
      if (!task.statusId) return [`task ${task.id} has no status`];
      return valid.has(task.statusId)
        ? []
        : [`task ${task.id} is in ${task.statusId}, which does not hold tasks`];
    });
  },
});
