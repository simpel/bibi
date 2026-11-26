import { allBlockers, archivedParent, countBlocker } from "../../archive/blockers";
import type { KindInput } from "../../archive/lifecycle-kind";
import {
  ARCHIVED_SELECT,
  archivedRows,
  archivedWhere,
  EITHER_STATUS,
  type LifecycleKind,
  lifecycleRow,
  REACTIVATE,
} from "../../archive/lifecycle-kind";
import { deleteRecordDependents, deleteRecordRows, hardDelete } from "../../archive/record-rows";

const anyStatus = ({ customerId }: { customerId: string }) => ({
  customerId,
  status: EITHER_STATUS,
});

/** Its orders, tasks, own bundles and price lists, archived or not: they go first. */
const deleteBlockers = ({ context, id }: KindInput) => {
  const where = anyStatus({ customerId: id });
  return allBlockers({
    checks: [
      countBlocker({
        count: context.db.order.count({ where }),
        feature: "order",
        path: "orders",
        what: "orders",
      }),
      countBlocker({
        count: context.db.task.count({ where }),
        feature: "task",
        path: "tasks",
        what: "tasks",
      }),
      countBlocker({
        count: context.db.item.count({ where }),
        feature: "item",
        path: "items",
        what: "items",
      }),
      countBlocker({
        count: context.db.priceList.count({ where }),
        feature: "priceList",
        path: "priceLists",
        what: "price lists",
      }),
    ],
  });
};

/**
 * Customers (ADR 0022, 0118): deleted with their contacts (rows without a page of their own),
 * once no order, task, bundle or price list of theirs is left. Restored only while their type
 * is active.
 */
export const customerKind: LifecycleKind = {
  entityType: "customer",
  label: "Customer",
  record: true,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.customer.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  restoreBlockers: async ({ context, id }) => {
    const row = await context.db.customer.findFirst({
      where: { id, status: "ARCHIVED" },
      select: { entityType: { select: { status: true } } },
    });
    const status = row?.entityType.status;
    return archivedParent({ status, feature: "configuration", path: "entityTypeId", what: "type" });
  },
  reactivate: async ({ context, id }) => {
    await context.db.customer.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers,
  remove: async ({ context, id }) => {
    const contacts = await context.db.contact.findMany({
      where: anyStatus({ customerId: id }),
      select: { id: true },
    });
    const ids = contacts.map((contact) => contact.id);
    await deleteRecordDependents({ context, ids });
    await hardDelete({ context }).contact.deleteMany({ where: { id: { in: ids } } });
    await deleteRecordRows({ context, ids });
    await hardDelete({ context }).customer.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.customer.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
