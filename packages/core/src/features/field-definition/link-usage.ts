import type { RecordMatches } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { usageConflict } from "../../records/blocking-issues";

export type LinkedRecord = { id: string; entityTypeId: string };

export type LinksToInput = {
  context: Pick<OperationContext, "db">;
  records: readonly LinkedRecord[];
};

/** How many linking records a refusal lists; the total counts them all. */
const LISTED = 20;

/**
 * Active records with a LINK value pointing to one of `records` (ADR 0026: data present →
 * CONFLICT): one indexed `EXISTS` on `RecordLink.targetRecordId` (ADR 0056).
 */
export async function linksTo({ context, records }: LinksToInput): Promise<RecordMatches> {
  const ids = [...new Set(records.map(({ id }) => id))];
  if (ids.length === 0) return { total: 0, rows: [] };
  const where = { links: { some: { targetRecordId: { in: ids } } } };
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

export type CheckNotLinkedInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  records: readonly LinkedRecord[];
  what: string;
};

/**
 * CONFLICT while an active record links to one of `records`; clear or change those links first.
 * `issues` lists the linking records.
 */
export async function checkNotLinked({
  context,
  records,
  what,
}: CheckNotLinkedInput): Promise<Result<true>> {
  const usage = await linksTo({ context, records });
  if (usage.total === 0) return ok({ value: true });
  const message = `${what} is linked from ${usage.total} records; change those links first`;
  return usageConflict({ context, usage, message });
}
