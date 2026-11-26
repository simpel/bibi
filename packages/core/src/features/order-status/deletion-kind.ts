import { allBlockers, countBlocker } from "../../archive/blockers";
import {
  ARCHIVED_SELECT,
  archivedRows,
  archivedWhere,
  EITHER_STATUS,
  type KindInput,
  type LifecycleKind,
  lifecycleRow,
  REACTIVATE,
} from "../../archive/lifecycle-kind";
import { hardDelete } from "../../archive/record-rows";

/** Orders in it or that passed through it, and packages that start in it, archived or not. */
const deleteBlockers = ({ context, id }: KindInput) =>
  allBlockers({
    checks: [
      countBlocker({
        count: context.db.order.count({ where: { statusId: id, status: EITHER_STATUS } }),
        ...{ feature: "order", path: "orders", what: "orders" },
      }),
      countBlocker({
        count: context.db.orderStatusChange.count({
          where: { OR: [{ fromStatusId: id }, { toStatusId: id }] },
        }),
        ...{ feature: "order", path: "statusHistory", what: "status changes of orders" },
      }),
      countBlocker({
        count: context.db.orderTemplate.count({ where: { statusId: id, status: EITHER_STATUS } }),
        ...{ feature: "orderTemplate", path: "packages", what: "packages" },
      }),
    ],
  });

/**
 * Statuses (ADR 0043, 0118): deleted with their transitions, gates, grid cells and board places
 * once no order is or was in them and no package starts in them. Restored on no board, like a
 * new status.
 */
export const orderStatusKind: LifecycleKind = {
  entityType: "orderStatus",
  label: "Status",
  record: false,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.orderStatus.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  reactivate: async ({ context, id }) => {
    await context.db.orderStatus.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers,
  remove: async ({ context, id }) => {
    const { db } = context;
    await db.boardPhaseStatus.deleteMany({ where: { statusId: id } });
    await db.statusStateRule.deleteMany({ where: { statusId: id } });
    await db.orderStatusGate.deleteMany({
      where: { OR: [{ toStatusId: id }, { fromStatusId: id }] },
    });
    await db.orderStatusTransition.deleteMany({
      where: { OR: [{ fromStatusId: id }, { toStatusId: id }] },
    });
    await hardDelete({ context }).orderStatus.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.orderStatus.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
