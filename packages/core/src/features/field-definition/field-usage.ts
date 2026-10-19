import type { RecordFieldMatch, RecordMatches } from "@okazi/db";
import type { OperationContext } from "../../operations/types";

type Db = Pick<OperationContext, "db">;

/** How many blocking records a usage check lists; the total counts them all. */
const LISTED = 20;

export type RecordsOfTypeInput = { context: Db; entityTypeId: string };

/**
 * Active records of a type on the `Record` supertable (ADR 0056), plus the lines of active
 * predefined tickets with the type (counted, not listed). Archived rows are hidden by the
 * org-scoped client (ADR 0026).
 */
export async function recordsOfType({
  context,
  entityTypeId,
}: RecordsOfTypeInput): Promise<RecordMatches> {
  const rows = await context.db.record.findMany({
    where: { entityTypeId },
    select: { id: true, base: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: LISTED,
  });
  const total = await context.db.record.count({ where: { entityTypeId } });
  const templateLines = await context.db.ticketTemplateLine.count({
    where: { entityTypeId, template: { status: "ACTIVE" } },
  });
  return { total: total + templateLines, rows };
}

export type CountRecordsOfTypeInput = RecordsOfTypeInput & { id: string };

/** Whether `id` is an active record of the type (0 or 1). */
export const countRecordsOfType = ({ context, entityTypeId, id }: CountRecordsOfTypeInput) =>
  context.db.record.count({ where: { entityTypeId, id } });

export type RecordsMatchingInput = RecordsOfTypeInput & { match: RecordFieldMatch };

/** Active records of the type whose `fields` match: one indexed query (`?`, `@>`). */
export const recordsMatching = ({ context, entityTypeId, match }: RecordsMatchingInput) =>
  context.db.$findRecords({ entityTypeId, match, limit: LISTED });

export type AsFieldValuesInput = { value: unknown };

/** Narrows a stored JSON column to a field-value object. */
export function asFieldValues({ value }: AsFieldValuesInput): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
