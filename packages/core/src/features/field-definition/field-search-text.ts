import type { ScopedDbClient } from "@okazi/db";
import { asFieldValues } from "./field-usage";

export type FieldInfo = { key: string; name: string };

/** Prisma `include` for a typed record's type name and active field names. */
export const TYPE_FIELDS_INCLUDE = {
  entityType: {
    select: {
      name: true,
      fields: { where: { status: "ACTIVE" as const }, select: { key: true, name: true } },
    },
  },
};

type FieldLineInput = { field: FieldInfo; value: unknown; names: ReadonlyMap<string, string> };

function valueText({ value, names }: { value: unknown; names: ReadonlyMap<string, string> }) {
  return typeof value === "string" ? (names.get(value) ?? value) : String(value);
}

/** A true boolean reads as the field name alone (locale-neutral); false adds nothing. */
function fieldLine({ field, value, names }: FieldLineInput): string | null {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? field.name : null;
  const values = (Array.isArray(value) ? value : [value]).map((v) =>
    valueText({ value: v, names }),
  );
  return `${field.name}: ${values.join(", ")}`;
}

export type FieldSearchLinesInput = {
  fields: readonly FieldInfo[];
  stored: unknown;
  names: ReadonlyMap<string, string>;
};

/** "Field name: value" lines for search text; list value and linked record ids become names. */
export function fieldSearchLines({ fields, stored, names }: FieldSearchLinesInput): string[] {
  const values = asFieldValues({ value: stored });
  return fields
    .map((field) => fieldLine({ field, value: values[field.key], names }))
    .filter((line): line is string => line !== null);
}

export type LoadValueNamesInput = { db: ScopedDbClient; rows: readonly { fields: unknown }[] };

type NameRow = { id: string; name: string };

/**
 * Names of the records the rows' field values refer to: list values (archived included) and
 * linked items, customers, contacts and bookings (by reference). Ids are globally unique.
 */
export async function loadValueNames({
  db,
  rows,
}: LoadValueNamesInput): Promise<ReadonlyMap<string, string>> {
  const ids = rows.flatMap((row) =>
    Object.values(asFieldValues({ value: row.fields }))
      .flat()
      .filter((v) => typeof v === "string"),
  );
  const where = { id: { in: ids } };
  const [values, items, customers, contacts, bookings] = await Promise.all([
    db.vocabularyValue.findMany({
      where: { ...where, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { id: true, name: true },
    }),
    db.item.findMany({ where, select: { id: true, name: true } }),
    db.customer.findMany({ where, select: { id: true, name: true } }),
    db.contact.findMany({ where, select: { id: true, name: true } }),
    db.booking.findMany({ where, select: { id: true, reference: true } }),
  ]);
  const refs: NameRow[] = bookings.map((b) => ({ id: b.id, name: String(b.reference) }));
  return new Map(
    [...values, ...items, ...customers, ...contacts, ...refs].map((r) => [r.id, r.name]),
  );
}
