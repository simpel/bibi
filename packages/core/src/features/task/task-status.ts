import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";

type Db = { context: Pick<OperationContext, "db"> };
type Audited = { context: Pick<OperationContext, "db" | "recordChange"> };

/** A status a task may sit in (ADR 0121): active (`scopedDb`), flagged and not closing. */
export const TASK_STATUS_WHERE = {
  tasks: true,
  closes: false,
} satisfies Prisma.OrderStatusWhereInput;

/**
 * Locks a status a task is about to sit in, and says whether it still may (flagged, active, not
 * closing). A concurrent archive or flag change waits for the task's transaction, or the task
 * sees it and picks another status: no task is left in a status that cannot hold it.
 */
export async function claimTaskStatus({ context, id }: Db & { id: string }) {
  const { count } = await context.db.orderStatus.updateMany({
    where: { id, ...TASK_STATUS_WHERE },
    data: { tasks: true },
  });
  return count > 0;
}

/** The entry status when it holds tasks, else the first status that does by position. */
async function findDefault({ context }: Db) {
  const row = await context.db.orderStatus.findFirst({
    where: TASK_STATUS_WHERE,
    orderBy: [{ entry: "desc" }, { position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  return row?.id ?? null;
}

/**
 * The status a task without an order starts in (ADR 0121): the entry status if tasks may sit
 * there, else the first flagged status by position; null when no status holds tasks (then the
 * task is on no board). The status is claimed (`claimTaskStatus`).
 */
export async function defaultTaskStatusId({ context }: Db): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const id = await findDefault({ context });
    if (!id || (await claimTaskStatus({ context, id }))) return id;
  }
  return null;
}

/**
 * Puts a task without an order back where it may be (ADR 0121): it keeps its status while that
 * still holds tasks, else it takes the default. A task with an order has none. Used when a task
 * is reopened, restored or unlinked; the caller audits the task.
 */
export async function settleTaskStatus({ context, taskId }: Db & { taskId: string }) {
  const task = await context.db.task.findFirst({
    where: { id: taskId },
    select: { statusId: true, orderId: true },
  });
  if (!task) return;
  if (task.orderId) {
    if (task.statusId)
      await context.db.task.update({ where: { id: taskId }, data: { statusId: null } });
    return;
  }
  if (task.statusId && (await claimTaskStatus({ context, id: task.statusId }))) return;
  const statusId = await defaultTaskStatusId({ context });
  if (statusId !== task.statusId) {
    await context.db.task.update({ where: { id: taskId }, data: { statusId } });
  }
}

export type MoveTasksToDefaultInput = Audited & {
  /**
   * The status that can no longer hold tasks (archived or unflagged): every task in it, open or
   * done, active or archived, moves. `null`: the open, active tasks without an order and without
   * a status take one, after a status started to hold tasks.
   */
  from: string | null;
};

/**
 * Moves tasks to the default status (ADR 0121), after the status change that makes it necessary
 * has been written; audited per task. Returns how many moved.
 */
export async function moveTasksToDefault({ context, from }: MoveTasksToDefaultInput) {
  const where: Prisma.TaskWhereInput = from
    ? { statusId: from, status: { in: ["ACTIVE", "ARCHIVED"] } }
    : { statusId: null, orderId: null, doneAt: null };
  const rows = await context.db.task.findMany({ where, select: { id: true } });
  if (rows.length === 0) return 0;
  const statusId = await defaultTaskStatusId({ context });
  if (statusId === from) return 0;
  const ids = rows.map((row) => row.id);
  await context.db.task.updateMany({ where: { ...where, id: { in: ids } }, data: { statusId } });
  for (const id of ids) {
    const before = { statusId: from };
    context.recordChange({ entityType: "task", entityId: id, before, after: { statusId } });
  }
  return ids.length;
}
