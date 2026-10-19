import type { RecordStatus } from "@okazi/db";
import type { OperationContext } from "../operations/types";
import { toJson } from "../shared/to-json";

type Db = { context: Pick<OperationContext, "db"> };

/** The supertable columns that mirror the extending row (ADR 0056). */
export type RecordChange = { fields?: unknown; status?: RecordStatus; entityTypeId?: string };

export type UpdateRecordsInput = Db & { ids: readonly string[]; change: RecordChange };

/**
 * Mirrors a change of `fields`, `status` or the type on the extending rows to their `Record` rows, in the
 * same transaction. Call it next to every update of a configurable entity that changes either.
 * Archived records are matched too, so a status change back is mirrored as well.
 */
export async function updateRecords({ context, ids, change }: UpdateRecordsInput): Promise<void> {
  if (ids.length === 0) return;
  const data = {
    ...(change.fields === undefined ? {} : { fields: toJson({ value: change.fields }) ?? {} }),
    ...(change.status ? { status: change.status } : {}),
    ...(change.entityTypeId ? { entityTypeId: change.entityTypeId } : {}),
  };
  if (Object.keys(data).length === 0) return;
  await context.db.record.updateMany({
    where: { id: { in: [...ids] }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    data,
  });
}

export type UpdateRecordInput = Db & { id: string; change: RecordChange };

/** `updateRecords` for one record. */
export const updateRecord = ({ context, id, change }: UpdateRecordInput) =>
  updateRecords({ context, ids: [id], change });

export type ArchiveRecordsInput = Db & { ids: readonly string[] };

/** Archives the `Record` rows of archived records (archiving updates both rows, ADR 0056). */
export const archiveRecords = ({ context, ids }: ArchiveRecordsInput) =>
  updateRecords({ context, ids, change: { status: "ARCHIVED" } });
