import type { RecordMatches } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { mergeUsage } from "../../records/blocking-issues";
import { recordsMatching } from "../field-definition/field-usage";

type Db = Pick<OperationContext, "db">;

export type ListFieldsUsingInput = { context: Db; vocabularyId: string };

/** Active fields whose values come from the list. */
export const listFieldsUsing = ({ context, vocabularyId }: ListFieldsUsingInput) =>
  context.db.fieldDefinition.findMany({
    where: { vocabularyId },
    select: { entityTypeId: true, key: true, name: true },
  });

export type ValueInUseInput = ListFieldsUsingInput & { valueId: string };

/**
 * Active records that carry the list value: in any CHOICE or MULTI_CHOICE field (one indexed
 * `fields @>` query per field, ADR 0056) or as the value a requirement counts (ADR 0021).
 */
export async function recordsUsingValue({
  context,
  vocabularyId,
  valueId,
}: ValueInUseInput): Promise<RecordMatches> {
  const where = { vocabularyValueId: valueId };
  const counted = await context.db.requirement.findMany({ where, select: { id: true }, take: 20 });
  const total = await context.db.requirement.count({ where });
  const rows = counted.map(({ id }) => ({ id, base: "REQUIREMENT" as const }));
  const usages: RecordMatches[] = [{ total, rows }];
  for (const { entityTypeId, key } of await listFieldsUsing({ context, vocabularyId })) {
    const match = { kind: "contains" as const, key, values: [valueId] };
    usages.push(await recordsMatching({ context, entityTypeId, match }));
  }
  return mergeUsage({ usages });
}
