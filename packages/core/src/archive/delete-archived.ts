import { Prisma } from "@bibi/db";
import { ok, type Result } from "../errors/result";
import { conflict, notFound } from "../shared/errors";
import { blockedConflict } from "./blockers";
import type { KindInput, LifecycleKind } from "./lifecycle-kind";
import { deleteRecordDependents, deleteRecordRows } from "./record-rows";

export type DeleteArchivedInput = KindInput & { kind: LifecycleKind };

/** A foreign key the kind's blockers did not foresee: still refused, never a half delete. */
const isStillReferenced = ({ error }: { error: unknown }) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";

async function removeAll({ kind, context, id }: DeleteArchivedInput) {
  if (kind.record) await deleteRecordDependents({ context, ids: [id] });
  if (kind.indexedAs) {
    await context.db.$deleteEmbedding({
      entityType: kind.indexedAs,
      entityId: id,
      isRecord: false,
    });
  }
  await kind.remove({ context, id });
  if (kind.record) await deleteRecordRows({ context, ids: [id] });
}

/**
 * Deletes an archived record for good (ADR 0118): its row, its `Record` row and the rows that
 * mean nothing without it. An active record is CONFLICT (archive it first); one that another
 * record still refers to is CONFLICT naming them. Returns the raw row before, for the audit row.
 */
export async function deleteArchived({
  kind,
  context,
  id,
}: DeleteArchivedInput): Promise<Result<unknown>> {
  const found = await kind.find({ context, id });
  if (!found) return notFound({ entity: kind.label });
  const allowed = kind.check?.({ context, id, row: found.row });
  if (allowed && !allowed.ok) return allowed;
  if (!found.archived) {
    return conflict({ message: `${kind.label} is active: archive it first` });
  }
  const blockers = await kind.deleteBlockers({ context, id });
  if (blockers.length > 0) {
    return blockedConflict({ context, message: `${kind.label} cannot be deleted`, blockers });
  }
  try {
    await removeAll({ kind, context, id });
  } catch (error) {
    if (!isStillReferenced({ error })) throw error;
    return conflict({ message: `${kind.label} cannot be deleted: another record still uses it` });
  }
  return ok({ value: found.row });
}
