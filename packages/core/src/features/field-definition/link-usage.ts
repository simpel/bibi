import type { RecordMatches } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { mergeUsage, usageConflict } from "../../records/blocking-issues";
import { recordsMatching } from "./field-usage";

export type LinkedRecord = { id: string; entityTypeId: string };

export type LinksToInput = {
  context: Pick<OperationContext, "db">;
  records: readonly LinkedRecord[];
};

/**
 * Active records whose LINK fields point to one of `records` (ADR 0026: data present → CONFLICT):
 * one indexed `fields @> {key: id}` query per LINK field that targets their types (ADR 0056).
 */
export async function linksTo({ context, records }: LinksToInput): Promise<RecordMatches> {
  const typeIds = [...new Set(records.map(({ entityTypeId }) => entityTypeId))];
  if (typeIds.length === 0) return { total: 0, rows: [] };
  const fields = await context.db.fieldDefinition.findMany({
    where: { kind: "LINK", linkTypeId: { in: typeIds } },
    select: { entityTypeId: true, key: true, linkTypeId: true },
  });
  const usages: RecordMatches[] = [];
  for (const { entityTypeId, key, linkTypeId } of fields) {
    const values = records.filter((record) => record.entityTypeId === linkTypeId);
    const match = { kind: "contains" as const, key, values: values.map(({ id }) => id) };
    usages.push(await recordsMatching({ context, entityTypeId, match }));
  }
  return mergeUsage({ usages });
}

export type CheckNotLinkedInput = {
  context: OperationContext;
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
