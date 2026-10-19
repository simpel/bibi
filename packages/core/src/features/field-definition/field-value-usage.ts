import type { FieldDefinition, RecordMatches } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { recordsMatching } from "./field-usage";

/** How many blocking records a usage check lists; the total counts them all. */
const LISTED = 20;

export type RecordsWithValueInput = {
  context: Pick<OperationContext, "db">;
  field: Pick<FieldDefinition, "id" | "kind" | "entityTypeId" | "key">;
  /** `has` a value for the field, or `lacks` one. */
  presence: "has" | "lacks";
};

/**
 * Active records of the field's type that have (or lack) a value for it (ADR 0056): a `LINK`
 * field's values are `RecordLink` rows (an indexed `EXISTS`), every other kind is a key in
 * `Record.fields` (GIN).
 */
export async function recordsWithValue({
  context,
  field,
  presence,
}: RecordsWithValueInput): Promise<RecordMatches> {
  const { entityTypeId, key } = field;
  if (field.kind !== "LINK") {
    return recordsMatching({ context, entityTypeId, match: { kind: presence, key } });
  }
  const links = { [presence === "has" ? "some" : "none"]: { fieldId: field.id } };
  const where = { entityTypeId, links };
  const [rows, total] = await Promise.all([
    context.db.record.findMany({
      where,
      select: { id: true, base: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: LISTED,
    }),
    context.db.record.count({ where }),
  ]);
  return { total, rows };
}
