import { countBlocker } from "../../archive/blockers";
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
 * Item type groups (ADR 0101, 0118): archiving one already moves its types to ungrouped, so it
 * is deleted unless a type was put in it since. Restored empty.
 */
export const itemTypeGroupKind: LifecycleKind = {
  entityType: "itemTypeGroup",
  label: "Item type group",
  record: false,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.itemTypeGroup.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  reactivate: async ({ context, id }) => {
    await context.db.itemTypeGroup.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers: ({ context, id }) =>
    countBlocker({
      count: context.db.entityType.count({ where: { groupId: id, status: EITHER_STATUS } }),
      ...{ feature: "configuration", path: "types", what: "types" },
    }),
  remove: async ({ context, id }) => {
    await hardDelete({ context }).itemTypeGroup.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.itemTypeGroup.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
