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
import { entityTypeDeleteBlockers } from "./deletion-blockers";

/** Its item states with their transitions and grid cells (ADR 0044). */
async function removeStates({ context, id }: KindInput) {
  const { db } = context;
  await db.entityType.update({
    where: { id, status: "ARCHIVED" },
    data: { expiryStateId: null },
  });
  const states = await db.itemState.findMany({
    where: { entityTypeId: id, status: EITHER_STATUS },
    select: { id: true },
  });
  const stateIds = { in: states.map((state) => state.id) };
  await db.itemStateTransition.deleteMany({
    where: { OR: [{ fromStateId: stateIds }, { toStateId: stateIds }] },
  });
  await db.statusStateRule.deleteMany({
    where: { OR: [{ entityTypeId: id }, { stateId: stateIds }] },
  });
  await hardDelete({ context }).itemState.deleteMany({ where: { entityTypeId: id } });
}

/** Its fields, the archived templates' rows that list it, and its revenue accounts. */
async function removeOwnRows({ context, id }: KindInput) {
  const { db } = context;
  await db.revenueAccount.deleteMany({ where: { entityTypeId: id } });
  await db.accountMapping.deleteMany({ where: { entityTypeId: id } });
  await db.responsibilityEntityType.deleteMany({ where: { entityTypeId: id } });
  await db.runSheetDefinitionEntityType.deleteMany({ where: { entityTypeId: id } });
  await db.runSheetDefinitionField.deleteMany({ where: { field: { entityTypeId: id } } });
  await removeStates({ context, id });
  await hardDelete({ context }).fieldDefinition.deleteMany({ where: { entityTypeId: id } });
}

/**
 * Types (ADR 0021, 0118): deleted with their fields and item states once no record, line or
 * configuration uses them. Restored while the name is free (CONFLICT otherwise).
 */
export const entityTypeKind: LifecycleKind = {
  entityType: "entityType",
  label: "Type",
  record: false,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.entityType.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  reactivate: async ({ context, id }) => {
    await context.db.entityType.update({ where: { id, status: "ARCHIVED" }, data: REACTIVATE });
  },
  deleteBlockers: entityTypeDeleteBlockers,
  remove: async ({ context, id }) => {
    await removeOwnRows({ context, id });
    await hardDelete({ context }).entityType.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.entityType.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
