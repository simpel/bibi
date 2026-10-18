import type { OperationContext } from "../../operations/types";
import { containsChoice, countRecordsWithValue } from "../field-definition/field-usage";

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
 * Number of active records that carry the list value: in any field (items, customers, contacts, tickets)
 * or as the value a requirement counts (ADR 0021).
 */
export async function countRecordsUsingValue({
  context,
  vocabularyId,
  valueId,
}: ValueInUseInput): Promise<number> {
  let total = await context.db.requirement.count({ where: { vocabularyValueId: valueId } });
  for (const field of await listFieldsUsing({ context, vocabularyId })) {
    total += await countRecordsWithValue({
      context,
      entityTypeId: field.entityTypeId,
      key: field.key,
      matches: (value) => containsChoice({ value, choice: valueId }),
    });
  }
  return total;
}
