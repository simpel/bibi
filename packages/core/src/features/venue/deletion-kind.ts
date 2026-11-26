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
 * Venues (ADR 0118): deleted with their hours once no item is left at them (archiving a venue
 * archives its items, and the retention job deletes those first).
 */
export const venueKind: LifecycleKind = {
  entityType: "venue",
  label: "Venue",
  record: false,
  indexedAs: "venue",
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.venue.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  reactivate: async ({ context, id }) => {
    await context.db.venue.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers: ({ context, id }) =>
    countBlocker({
      count: context.db.item.count({ where: { venueId: id, status: EITHER_STATUS } }),
      ...{ feature: "item", path: "items", what: "items" },
    }),
  remove: async ({ context, id }) => {
    await context.db.hoursException.deleteMany({ where: { venueId: id } });
    await context.db.hoursDay.deleteMany({ where: { venueId: id } });
    await hardDelete({ context }).venue.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.venue.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
