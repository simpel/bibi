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

/** Run sheet templates and sent run sheets that name it, archived or not. */
const deleteBlockers = ({ context, id }: KindInput) =>
  allBlockers({
    checks: [
      countBlocker({
        count: context.db.runSheetDefinition.count({
          where: { responsibilityId: id, status: EITHER_STATUS },
        }),
        ...{ feature: "template", path: "runSheetDefinitions", what: "run sheet templates" },
      }),
      countBlocker({
        count: context.db.runSheet.count({ where: { responsibilityId: id } }),
        ...{ feature: "runSheet", path: "runSheets", what: "run sheets" },
      }),
    ],
  });

/**
 * The choices made on its slots (assignments and followers) and its lists of types and default
 * followers. The assignments are archived first so the relation trigger lets go of them (ADR
 * 0113); the relation rows of the slot go with the responsibility by cascade.
 */
async function removeOwnRows({ context, id }: KindInput) {
  const { db } = context;
  await db.assignment.updateMany({ where: { responsibilityId: id }, data: { status: "ARCHIVED" } });
  const assignments = await db.assignment.findMany({
    where: { responsibilityId: id, status: EITHER_STATUS },
    select: { id: true },
  });
  const assignmentId = { in: assignments.map((row) => row.id) };
  await db.assignmentFollower.deleteMany({ where: { assignmentId } });
  await hardDelete({ context }).assignment.deleteMany({ where: { id: assignmentId } });
  await db.responsibilityEntityType.deleteMany({ where: { responsibilityId: id } });
  await db.responsibilityDefaultFollower.deleteMany({ where: { responsibilityId: id } });
}

/**
 * Responsibilities (ADR 0034, 0118): deleted with the choices made on their slots once no run
 * sheet template or run sheet names them.
 */
export const responsibilityKind: LifecycleKind = {
  entityType: "responsibility",
  label: "Responsibility",
  record: false,
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.responsibility.findFirst({ where: { id, status: EITHER_STATUS } }),
    }),
  reactivate: async ({ context, id }) => {
    await context.db.responsibility.update({
      where: { id, status: "ARCHIVED" },
      data: REACTIVATE,
    });
  },
  deleteBlockers,
  remove: async ({ context, id }) => {
    await removeOwnRows({ context, id });
    await hardDelete({ context }).responsibility.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.responsibility.findMany({
        where: archivedWhere({ before }),
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
