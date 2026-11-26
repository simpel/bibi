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
 * Run sheet templates (ADR 0118): deleted with their lists of types, fields and lists once no run
 * sheet was made from them (sent run sheets are the orders' history and keep them).
 */
export const runSheetDefinitionKind: LifecycleKind = {
  entityType: "runSheetDefinition",
  label: "Run sheet template",
  record: false,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.runSheetDefinition.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  restoreBlockers: async ({ context, id }) => {
    const row = await context.db.runSheetDefinition.findFirst({
      where: { id, status: "ARCHIVED" },
      select: { responsibility: { select: { status: true } } },
    });
    return row?.responsibility.status === "ARCHIVED"
      ? [
          {
            feature: "responsibility",
            path: "responsibilityId",
            message: "Restore its responsibility first",
          },
        ]
      : [];
  },
  reactivate: async ({ context, id }) => {
    await context.db.runSheetDefinition.update({
      where: { id, status: "ARCHIVED" },
      data: REACTIVATE,
    });
  },
  deleteBlockers: ({ context, id }) =>
    countBlocker({
      count: context.db.runSheet.count({ where: { runSheetDefinitionId: id } }),
      ...{ feature: "runSheet", path: "runSheets", what: "run sheets" },
    }),
  remove: async ({ context, id }) => {
    const own = { runSheetDefinitionId: id };
    await context.db.runSheetDefinitionEntityType.deleteMany({ where: own });
    await context.db.runSheetDefinitionField.deleteMany({ where: own });
    await context.db.runSheetDefinitionVocabulary.deleteMany({ where: own });
    await hardDelete({ context }).runSheetDefinition.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.runSheetDefinition.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
