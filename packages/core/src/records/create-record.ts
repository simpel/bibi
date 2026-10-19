import type { RecordBase } from "@okazi/db";
import type { OperationContext } from "../operations/types";
import { toJson } from "../shared/to-json";
import { type LinkValue, replaceRecordLinks } from "./record-links";

export type CreateRecordInput<T> = {
  context: Pick<OperationContext, "db" | "organizationId">;
  base: RecordBase;
  entityTypeId: string;
  /** The record's scalar and choice values; mirrored on the supertable row. */
  fields?: unknown;
  /** The record's `LINK` values, written as `RecordLink` rows (ADR 0056). */
  links?: readonly LinkValue[];
  /** Writes the extending row (`Item`, `Ticket`, …) with the supertable row's `id`. */
  insert: (input: { id: string }) => Promise<T>;
};

/**
 * Creates a record of a configurable entity (ADR 0056): the `Record` supertable row first, then
 * the extending row with the same id, and the `LINK` values as `RecordLink` rows. Commands run in one transaction, so both rows commit or
 * neither does.
 */
export async function createRecord<T>({
  context,
  base,
  entityTypeId,
  fields,
  links,
  insert,
}: CreateRecordInput<T>): Promise<T> {
  const { id } = await context.db.record.create({
    data: {
      base,
      entityTypeId,
      fields: toJson({ value: fields ?? {} }) ?? {},
      organizationId: context.organizationId,
    },
    select: { id: true },
  });
  if (links) await replaceRecordLinks({ context, recordId: id, links });
  return insert({ id });
}
