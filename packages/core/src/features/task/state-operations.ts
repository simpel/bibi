import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { linkTasks, loadLinkableOrder } from "./link-order";
import { TaskIdInputSchema, TaskLinkOrderInputSchema, TaskSchema } from "./schema";
import { syncTaskHolds } from "./sync-task-holds";
import { relateTaskItems } from "./task-items";
import { checkTaskAccess } from "./task-rules";
import { settleTaskStatus } from "./task-status";
import { loadTask, TASK_INCLUDE, toTaskDtos } from "./to-task-dto";

type SetDoneInput = { context: OperationContext; id: string; done: boolean };

/**
 * Marks the task done (stamps when and by whom) or open again, and records the change. Done
 * releases its holds for good (ADR 0120): its prebooked and booked rooms become related, so
 * reopening it brings no hold back.
 */
async function setDone({ context, id, done }: SetDoneInput) {
  const before = await loadTask({ context, id });
  if (!before) return notFound({ entity: "Task" });
  if ((before.doneAt !== null) === done) return ok({ value: before });
  await context.db.task.update({
    where: { id },
    data: done
      ? { doneAt: nowOf({ context }), doneById: context.actor.userId }
      : { doneAt: null, doneById: null },
  });
  if (done) await relateTaskItems({ context, taskId: id });
  // Done keeps its status; reopened, it is back where it was if that still holds tasks (ADR 0121).
  else await settleTaskStatus({ context, taskId: id });
  const held = await syncTaskHolds({ context, taskId: id });
  if (!held.ok) return held;
  const task = await loadTask({ context, id });
  if (!task) return notFound({ entity: "Task" });
  context.recordChange({ entityId: id, before, after: task });
  return ok({ value: task });
}

export const completeTask = defineOperation({
  name: "task.complete",
  kind: "command",
  description:
    "Mark a task done: sets doneAt and doneById and releases its rooms' holds for good (ADR " +
    "0120: each prebook or book becomes related; reopening does not hold them again) and takes " +
    "it off the board (ADR 0121). A task already done is returned unchanged.",
  input: TaskIdInputSchema,
  output: TaskSchema,
  permission: "task:write",
  handler: ({ input: { id }, context }) => setDone({ context, id, done: true }),
});

export const reopenTask = defineOperation({
  name: "task.reopen",
  kind: "command",
  description:
    "Open a done task again: clears doneAt and doneById; its rooms stay related, so set a " +
    "prebook or book again with task.update. Without an order it is back on the board in its " +
    "status, or the default one if that no longer holds tasks (ADR 0121). An open task is " +
    "unchanged.",
  input: TaskIdInputSchema,
  output: TaskSchema,
  permission: "task:write",
  handler: ({ input: { id }, context }) => setDone({ context, id, done: false }),
});

export const linkTaskOrder = defineOperation({
  name: "task.linkOrder",
  kind: "command",
  description:
    "Link a task to an order, once (ADR 0117): an active order of the task's own customer " +
    "(VALIDATION otherwise). A task already linked is CONFLICT; the link never changes. Needs " +
    "order:read.",
  input: TaskLinkOrderInputSchema,
  output: TaskSchema,
  permission: "task:write",
  handler: async ({ input: { taskId, orderId }, context }) => {
    const access = checkTaskAccess({ context, refs: { orderId } });
    if (!access.ok) return access;
    const before = await loadTask({ context, id: taskId });
    if (!before) return notFound({ entity: "Task" });
    const order = await loadLinkableOrder({ context, orderId, path: "orderId" });
    if (!order.ok) return order;
    const linked = await linkTasks({
      ...{ context, orderId, customerId: order.value.customerId, taskIds: [taskId] },
      pathOf: () => "orderId",
    });
    if (!linked.ok) return linked;
    const task = await loadTask({ context, id: taskId });
    return task ? ok({ value: task }) : notFound({ entity: "Task" });
  },
});

export const archiveTask = defineOperation({
  name: "task.archive",
  kind: "command",
  description:
    "Delete (archive) a task: it leaves lists, the calendar, pipeline cards and Needs you, and " +
    "its rooms' holds are released until it is restored.",
  input: TaskIdInputSchema,
  output: TaskSchema,
  permission: "task:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await loadTask({ context, id });
    if (!before) return notFound({ entity: "Task" });
    const row = await context.db.task.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: nowOf({ context }) },
      include: TASK_INCLUDE,
    });
    await archiveRecords({ context, ids: [id] });
    const held = await syncTaskHolds({ context, taskId: id });
    if (!held.ok) return held;
    const [task] = await toTaskDtos({ context, rows: [row] });
    if (!task) return notFound({ entity: "Task" });
    context.recordChange({ entityId: id, before, after: task });
    return ok({ value: task });
  },
});
