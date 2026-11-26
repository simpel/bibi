import { archivedParent } from "../../archive/blockers";
import {
  ARCHIVED_SELECT,
  archivedRows,
  archivedWhere,
  EITHER_STATUS,
  type LifecycleKind,
  lifecycleRow,
  REACTIVATE,
} from "../../archive/lifecycle-kind";
import { hardDelete } from "../../archive/record-rows";

/**
 * Price lists (ADR 0023, 0118): nothing refers to a price list but its own prices, which go with
 * it. A customer's price list is restored only while the customer is active.
 */
export const priceListKind: LifecycleKind = {
  entityType: "priceList",
  label: "Price list",
  record: false,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.priceList.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  restoreBlockers: async ({ context, id }) => {
    const row = await context.db.priceList.findFirst({
      where: { id, status: "ARCHIVED" },
      select: { customer: { select: { status: true } } },
    });
    const status = row?.customer?.status;
    return archivedParent({ status, feature: "customer", path: "customerId", what: "customer" });
  },
  reactivate: async ({ context, id }) => {
    await context.db.priceList.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers: async () => [],
  remove: async ({ context, id }) => {
    await context.db.priceListItem.deleteMany({ where: { priceListId: id } });
    await hardDelete({ context }).priceList.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.priceList.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
