import type { OperationContext } from "../../operations/types";

type Db = Pick<OperationContext, "db">;

export type FieldValuesOfTypeInput = { context: Db; entityTypeId: string };

/**
 * The `fields` JSON of every active item of a type. Used by the "data present → CONFLICT" rules
 * (ADR 0021). Catalogs are small (hundreds of rows), so the check runs in memory.
 */
export async function fieldValuesOfType({
  context,
  entityTypeId,
}: FieldValuesOfTypeInput): Promise<Record<string, unknown>[]> {
  const rows = await context.db.item.findMany({
    where: { entityTypeId },
    select: { fields: true },
  });
  return rows.map((row) => asFieldValues({ value: row.fields }));
}

export type AsFieldValuesInput = { value: unknown };

/** Narrows a stored JSON column to a field-value object. */
export function asFieldValues({ value }: AsFieldValuesInput): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export type CountWithValueInput = FieldValuesOfTypeInput & {
  key: string;
  matches?: (value: unknown) => boolean;
};

/** Active items of the type that have a value for `key` (optionally a matching one). */
export async function countItemsWithValue({
  context,
  entityTypeId,
  key,
  matches = () => true,
}: CountWithValueInput): Promise<number> {
  const all = await fieldValuesOfType({ context, entityTypeId });
  return all.filter((fields) => key in fields && matches(fields[key])).length;
}

export type ContainsChoiceInput = { value: unknown; choice: string };

/** True when a CHOICE value is `choice` or a MULTI_CHOICE value includes it. */
export const containsChoice = ({ value, choice }: ContainsChoiceInput) =>
  value === choice || (Array.isArray(value) && value.includes(choice));
