import { Prisma } from "../generated/prisma/client";
import type { RecordFieldMatch } from "./types";

export type FieldConditionInput = { match: RecordFieldMatch };

/** JSON containment patterns for one value: the scalar form and the array (MULTI_CHOICE) form. */
const patternsFor = ({ key, value }: { key: string; value: string }) => [
  JSON.stringify({ [key]: value }),
  JSON.stringify({ [key]: [value] }),
];

/**
 * The SQL condition on `"fields"` for a match. `?` and `@>` are served by the GIN index on
 * `Record.fields` (`jsonb_ops`); `lacks` filters the type's rows found by the btree index.
 */
export function fieldCondition({ match }: FieldConditionInput): Prisma.Sql {
  if (match.kind === "has") return Prisma.sql`"fields" ? ${match.key}`;
  if (match.kind === "lacks") return Prisma.sql`NOT ("fields" ? ${match.key})`;
  const patterns = match.values.flatMap((value) => patternsFor({ key: match.key, value }));
  return Prisma.sql`"fields" @> ANY(${patterns}::jsonb[])`;
}
