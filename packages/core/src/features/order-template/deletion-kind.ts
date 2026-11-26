import { allBlockers, archivedParent, countBlocker } from "../../archive/blockers";
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
 * Packages (ADR 0112, 0118): deleted with their lines once no inbox endpoint offers them.
 * Restored only while their type and start status are active (and the name is free: CONFLICT).
 */
export const orderTemplateKind: LifecycleKind = {
  entityType: "orderTemplate",
  label: "Package",
  record: true,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.orderTemplate.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  restoreBlockers: async ({ context, id }) => {
    const row = await context.db.orderTemplate.findFirst({
      where: { id, status: "ARCHIVED" },
      select: {
        entityType: { select: { status: true } },
        orderStatus: { select: { status: true } },
      },
    });
    return allBlockers({
      checks: [
        archivedParent({
          status: row?.entityType.status,
          ...{ feature: "configuration", path: "entityTypeId", what: "type" },
        }),
        archivedParent({
          status: row?.orderStatus.status,
          ...{ feature: "pipeline", path: "statusId", what: "start status" },
        }),
      ],
    });
  },
  reactivate: async ({ context, id }) => {
    await context.db.orderTemplate.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers: ({ context, id }) =>
    countBlocker({
      count: context.db.inboundEndpoint.count({
        where: { defaultTemplateId: id, status: EITHER_STATUS },
      }),
      ...{ feature: "inbox", path: "inboundEndpoints", what: "inbox addresses" },
    }),
  remove: async ({ context, id }) => {
    await context.db.orderTemplateLine.deleteMany({ where: { templateId: id } });
    await hardDelete({ context }).orderTemplate.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.orderTemplate.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
