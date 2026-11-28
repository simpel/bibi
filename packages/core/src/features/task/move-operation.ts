import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { loadFlowRules } from "../order-status/move-rule";
import { TaskMoveInputSchema, TaskSchema } from "./schema";
import { taskMoveBlockers } from "./task-moves";
import { claimTaskStatus } from "./task-status";
import { loadTask } from "./to-task-dto";

type Db = { context: Pick<OperationContext, "db"> };

/** The target: an active status that holds tasks (`VALIDATION` at `statusId` otherwise). */
async function loadTarget({ context, statusId }: Db & { statusId: string }) {
  const to = await context.db.orderStatus.findFirst({ where: { id: statusId } });
  if (to?.tasks && !to.closes) return ok({ value: to });
  const message = to ? `"${to.name}" does not hold tasks` : "Unknown or archived status";
  return invalid({ message, issues: [{ path: "statusId", message }] });
}

/** The task's current status, archived or not; null when it has none. */
const loadFrom = ({ context, id }: Db & { id: string | null }) =>
  id
    ? context.db.orderStatus.findFirst({ where: { id, status: { in: ["ACTIVE", "ARCHIVED"] } } })
    : Promise.resolve(null);

export const moveTask = defineOperation({
  name: "task.move",
  kind: "command",
  description:
    "Move a task without an order to another pipeline status (ADR 0121), like an order: only a " +
    "status that holds tasks (orderStatus.list `tasks`; VALIDATION at statusId otherwise). A " +
    "status that restricts its next moves allows only its listed ones; the ASSIGNEE gate on the " +
    "target needs the task's assignee, and gates that read order data (reason, quote) are " +
    "skipped. A refused move changes nothing and is CONFLICT with every blocker in `issues`. " +
    "A task linked to an order follows its order and a done task is off the board: both CONFLICT.",
  input: TaskMoveInputSchema,
  output: TaskSchema,
  permission: "task:write",
  handler: async ({ input: { id, statusId }, context }) => {
    const before = await loadTask({ context, id });
    if (!before) return notFound({ entity: "Task" });
    if (before.orderId) {
      const message = "The task follows its order: unlink it to move it";
      return conflict({ message, issues: [{ path: "id", message }] });
    }
    if (before.doneAt) {
      const message = "The task is done: reopen it to move it";
      return conflict({ message, issues: [{ path: "id", message }] });
    }
    const to = await loadTarget({ context, statusId });
    if (!to.ok) return to;
    if (to.value.id === before.statusId) {
      return conflict({ message: `The task is already in "${to.value.name}"` });
    }
    const [from, rules] = await Promise.all([
      loadFrom({ context, id: before.statusId }),
      loadFlowRules({ context }),
    ]);
    const { assigneeId } = before;
    const blockers = taskMoveBlockers({ rules, from, to: to.value, assigneeId });
    if (blockers.length > 0) {
      return conflict({ message: `The task cannot move to "${to.value.name}"`, issues: blockers });
    }
    if (!(await claimTaskStatus({ context, id: to.value.id }))) {
      const message = `"${to.value.name}" no longer holds tasks`;
      return invalid({ message, issues: [{ path: "statusId", message }] });
    }
    await context.db.task.update({ where: { id }, data: { statusId: to.value.id } });
    const task = await loadTask({ context, id });
    if (!task) return notFound({ entity: "Task" });
    context.recordChange({ entityId: id, before, after: task });
    return ok({ value: task });
  },
});
