import type { OperationContext } from "../../operations/types";

type Db = Pick<OperationContext, "db">;

export type FieldValuesOfTypeInput = { context: Db; entityTypeId: string };

/**
 * The `fields` JSON of every active record of a type: items, customers, contacts, bookings or program items (a
 * type has one base, so only one table has rows). Used by the "data present → CONFLICT" rules (ADR 0021).
 * Archived rows are not counted: the org-scoped client hides `status = ARCHIVED` rows (ADR 0026).
 * Record counts per type are small (hundreds of rows), so the check runs in memory.
 */
export async function fieldValuesOfType({
  context,
  entityTypeId,
}: FieldValuesOfTypeInput): Promise<Record<string, unknown>[]> {
  const query = { where: { entityTypeId }, select: { fields: true } };
  const rows = [
    ...(await context.db.item.findMany(query)),
    ...(await context.db.customer.findMany(query)),
    ...(await context.db.contact.findMany(query)),
    ...(await context.db.booking.findMany(query)),
    ...(await context.db.programItem.findMany(query)),
  ];
  return rows.map((row) => asFieldValues({ value: row.fields }));
}

export type CountRecordsOfTypeInput = FieldValuesOfTypeInput & { id?: string };

/** Active records (items, customers, contacts, bookings, program items) that have the type, optionally one id. */
export async function countRecordsOfType({
  context,
  entityTypeId,
  id,
}: CountRecordsOfTypeInput): Promise<number> {
  const where = { entityTypeId, ...(id ? { id } : {}) };
  return (
    (await context.db.item.count({ where })) +
    (await context.db.customer.count({ where })) +
    (await context.db.contact.count({ where })) +
    (await context.db.booking.count({ where })) +
    (await context.db.programItem.count({ where }))
  );
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

/** Active records of the type that have a value for `key` (optionally a matching one). */
export async function countRecordsWithValue({
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
