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

/** Fields, requirements, reservation needs and demand tags that use the list or its values. */
const deleteBlockers = ({ context, id }: KindInput) => {
  const value = { vocabularyId: id };
  return allBlockers({
    checks: [
      countBlocker({
        count: context.db.fieldDefinition.count({
          where: { vocabularyId: id, status: EITHER_STATUS },
        }),
        ...{ feature: "configuration", path: "fields", what: "fields" },
      }),
      countBlocker({
        count: context.db.requirement.count({
          where: { vocabularyValue: value, status: EITHER_STATUS },
        }),
        ...{ feature: "program", path: "requirements", what: "requirements" },
      }),
      countBlocker({
        count: context.db.reservationRequirement.count({ where: { vocabularyValue: value } }),
        ...{ feature: "reservation", path: "reservations", what: "reservation needs" },
      }),
      countBlocker({
        count: context.db.itemDemandTag.count({ where: { value } }),
        ...{ feature: "item", path: "demands", what: "item demands" },
      }),
      countBlocker({
        count: context.db.runSheetDefinitionVocabulary.count({
          where: { vocabularyId: id, runSheetDefinition: { status: "ACTIVE" } },
        }),
        ...{ feature: "template", path: "runSheetDefinitions", what: "run sheet templates" },
      }),
    ],
  });
};

/**
 * Lists (ADR 0021, 0118): deleted with their values once no field, requirement, demand or active
 * run sheet template uses them.
 */
export const vocabularyKind: LifecycleKind = {
  entityType: "vocabulary",
  label: "List",
  record: false,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.vocabulary.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  reactivate: async ({ context, id }) => {
    await context.db.vocabulary.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers,
  remove: async ({ context, id }) => {
    await context.db.runSheetDefinitionVocabulary.deleteMany({ where: { vocabularyId: id } });
    await hardDelete({ context }).vocabularyValue.deleteMany({ where: { vocabularyId: id } });
    await hardDelete({ context }).vocabulary.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.vocabulary.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
