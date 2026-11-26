import { withHardDelete } from "@bibi/db";
import type { OperationContext } from "../operations/types";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * The scoped client's delete methods for soft-deleted models (ADR 0118). Only `archive/` and the
 * kinds' `remove` call it: archiving stays the delete everywhere else.
 */
export const hardDelete = ({ context }: Db) => withHardDelete({ client: context.db });

export type DeleteRecordRowsInput = Db & { ids: readonly string[] };

/**
 * Deletes what a record has besides its own row (ADR 0056, 0113): its `LINK` values both ways,
 * its assignments and followers and its search index rows. Call it before the extending rows.
 */
export async function deleteRecordDependents({ context, ids }: DeleteRecordRowsInput) {
  if (ids.length === 0) return;
  const recordIds = { in: [...ids] };
  await context.db.recordLink.deleteMany({
    where: { OR: [{ recordId: recordIds }, { targetRecordId: recordIds }] },
  });
  const assignments = await context.db.assignment.findMany({
    where: { recordId: recordIds, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true },
  });
  const assignmentIds = { in: assignments.map((row) => row.id) };
  await context.db.assignmentFollower.deleteMany({ where: { assignmentId: assignmentIds } });
  await hardDelete({ context }).assignment.deleteMany({ where: { id: assignmentIds } });
  await context.db.embedding.deleteMany({ where: { recordId: recordIds } });
}

/**
 * Deletes the `Record` rows after their extending rows; their relation rows (ADR 0113) go by
 * cascade.
 */
export async function deleteRecordRows({ context, ids }: DeleteRecordRowsInput) {
  if (ids.length === 0) return;
  await hardDelete({ context }).record.deleteMany({ where: { id: { in: [...ids] } } });
}
