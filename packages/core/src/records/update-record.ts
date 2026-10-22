import type { RecordStatus } from "@bibi/db";
import type { OperationContext } from "../operations/types";
import { toJson } from "../shared/to-json";
import { type LinkValue, replaceRecordLinks } from "./record-links";

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

export type UpdateRecordInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  id: string;
  /** `links` replaces the record's `LINK` values (`RecordLink` rows); omitted = unchanged. */
  change: RecordChange & { links?: readonly LinkValue[] | undefined };
};

/** `updateRecords` for one record, plus its `LINK` values when given. */
export async function updateRecord({
  context,
  id,
  change: { links, ...change },
}: UpdateRecordInput) {
  await updateRecords({ context, ids: [id], change });
  if (links) await replaceRecordLinks({ context, recordId: id, links });
}

export type ArchiveRecordsInput = Db & { ids: readonly string[] };

/** Archives the `Record` rows of archived records (archiving updates both rows, ADR 0056). */
export const archiveRecords = ({ context, ids }: ArchiveRecordsInput) =>
  updateRecords({ context, ids, change: { status: "ARCHIVED" } });
