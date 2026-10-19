import type { Db } from "../client";
import type { RecordBase } from "../generated/prisma/client";
import { fieldCondition } from "./field-condition";
import type { FindRecordsInput, RecordMatches } from "./types";

export type FindRecordsArgs = FindRecordsInput & { db: Pick<Db, "$queryRaw"> };

type MatchRow = { id: string; base: RecordBase; total: number };

const DEFAULT_LIMIT = 20;

/**
 * Active records of one type whose `fields` match, as one indexed query on the `Record`
 * supertable (ADR 0056). Pinned to `organizationId`; archived records do not count.
 */
export async function findRecords({
  db,
  organizationId,
  entityTypeId,
  match,
  limit = DEFAULT_LIMIT,
}: FindRecordsArgs): Promise<RecordMatches> {
  if (match.kind === "contains" && match.values.length === 0) return { total: 0, rows: [] };
  const rows = await db.$queryRaw<MatchRow[]>`
    SELECT "id", "base", (count(*) OVER ())::int AS total
    FROM "Record"
    WHERE "organizationId" = ${organizationId}
      AND "entityTypeId" = ${entityTypeId}
      AND "status" = 'ACTIVE'
      AND ${fieldCondition({ match })}
    ORDER BY "createdAt", "id"
    LIMIT ${limit}`;
  return { total: rows[0]?.total ?? 0, rows: rows.map(({ id, base }) => ({ id, base })) };
}
