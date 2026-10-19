import type { RecordBase } from "@okazi/db";
import type { OperationContext } from "../operations/types";
import { toJson } from "../shared/to-json";

export type CreateRecordInput<T> = {
  context: Pick<OperationContext, "db" | "organizationId">;
  base: RecordBase;
  entityTypeId: string;
  /** The record's field values; mirrored on the supertable row. */
  fields?: unknown;
  /** Writes the extending row (`Item`, `Ticket`, …) with the supertable row's `id`. */
  insert: (input: { id: string }) => Promise<T>;
};

/**
 * Creates a record of a configurable entity (ADR 0056): the `Record` supertable row first, then
 * the extending row with the same id. Commands run in one transaction, so both rows commit or
 * neither does.
 */
export async function createRecord<T>({
  context,
  base,
  entityTypeId,
  fields,
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
  return insert({ id });
}
