import { allBlockers, archivedParent } from "../../archive/blockers";
import {
  archivedRows,
  archivedWhere,
  EITHER_STATUS,
  type LifecycleKind,
  lifecycleRow,
  REACTIVATE,
} from "../../archive/lifecycle-kind";
import { hardDelete } from "../../archive/record-rows";
import { syncTaskHolds } from "./sync-task-holds";
import { settleTaskStatus } from "./task-status";

/**
 * Tasks (ADR 0117, 0118): nothing else refers to a task, so an archived one is always deleted,
 * with its notifications, dismissals and rooms with their holds (cascade). Restored only while
 * its customer and contact (when it has them) are active; a restore holds its rooms again
 * (ADR 0120), and a book that now collides refuses it.
 */
export const taskKind: LifecycleKind = {
  entityType: "task",
  label: "Task",
  record: true,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.task.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  restoreBlockers: async ({ context, id }) => {
    const task = await context.db.task.findFirst({
      where: { id, status: "ARCHIVED" },
      select: {
        customer: { select: { status: true } },
        contact: { select: { status: true } },
      },
    });
    return allBlockers({
      checks: [
        archivedParent({
          status: task?.customer?.status,
          feature: "customer",
          path: "customerId",
          what: "customer",
        }),
        archivedParent({
          status: task?.contact?.status,
          feature: "customer",
          path: "contactId",
          what: "contact",
        }),
      ],
    });
  },
  reactivate: async ({ context, id }) => {
    await context.db.task.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  afterRestore: async ({ context, id }) => {
    // Back on the board in its status, or the default one (ADR 0121).
    await settleTaskStatus({ context, taskId: id });
    return syncTaskHolds({ context, taskId: id });
  },
  deleteBlockers: async () => [],
  remove: async ({ context, id }) => {
    await context.db.notification.deleteMany({ where: { taskId: id } });
    await hardDelete({ context }).task.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.task
        .findMany({
          where: archivedWhere({ before }),
          select: {
            id: true,
            archivedAt: true,
            entityType: { select: { name: true } },
            customer: { select: { name: true } },
          },
          orderBy: { archivedAt: "asc" },
        })
        .then((rows) =>
          rows.map(({ id, archivedAt, entityType, customer }) => ({
            id,
            archivedAt,
            name: customer ? `${entityType.name} · ${customer.name}` : entityType.name,
          })),
        ),
    }),
};
