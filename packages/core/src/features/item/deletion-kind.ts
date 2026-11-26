import { allBlockers, archivedParent } from "../../archive/blockers";
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
import { itemDeleteBlockers } from "./deletion-blockers";

/** Its type, venue and owning customer must be active to restore it. */
async function restoreBlockers({ context, id }: KindInput) {
  const item = await context.db.item.findFirst({
    where: { id, status: "ARCHIVED" },
    select: {
      entityType: { select: { status: true } },
      venue: { select: { status: true } },
      customer: { select: { status: true } },
    },
  });
  return allBlockers({
    checks: [
      archivedParent({
        status: item?.entityType.status,
        ...{ feature: "configuration", path: "entityTypeId", what: "type" },
      }),
      archivedParent({
        status: item?.venue?.status,
        ...{ feature: "venue", path: "venueId", what: "venue" },
      }),
      archivedParent({
        status: item?.customer?.status,
        ...{ feature: "customer", path: "customerId", what: "customer" },
      }),
    ],
  });
}

/**
 * What the item owns and what only says something about it: prices, revenue accounts, staff
 * links, manual blocks, hours, floor plans and layouts, demands, setups, parts and options.
 */
async function removeOwnRows({ context, id }: KindInput) {
  const { db } = context;
  const hard = hardDelete({ context });
  const own = { itemId: id };
  await db.priceListItem.deleteMany({ where: own });
  await db.revenueAccount.deleteMany({ where: own });
  await db.memberProfileItem.deleteMany({ where: own });
  await hard.occupancy.deleteMany({ where: own });
  await db.hoursException.deleteMany({ where: own });
  await db.hoursDay.deleteMany({ where: own });
  await db.floorElement.deleteMany({
    where: { OR: [{ floorPlan: own }, { setupLayout: own }] },
  });
  await hard.setupLayout.deleteMany({ where: own });
  await hard.floorPlan.deleteMany({ where: own });
  await hard.itemDemand.deleteMany({ where: own });
  await db.itemSetup.deleteMany({ where: own });
  await db.itemPart.deleteMany({ where: { parentId: id } });
  await db.itemCustomisationGroup.deleteMany({ where: own });
}

/**
 * Items (ADR 0021, 0118): deleted with what they own once nothing else uses them. Restored only
 * while their type, venue and customer are active.
 */
export const itemKind: LifecycleKind = {
  entityType: "item",
  label: "Item",
  record: true,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.item.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  restoreBlockers,
  reactivate: async ({ context, id }) => {
    await context.db.item.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers: itemDeleteBlockers,
  remove: async ({ context, id }) => {
    await removeOwnRows({ context, id });
    await hardDelete({ context }).item.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.item.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
