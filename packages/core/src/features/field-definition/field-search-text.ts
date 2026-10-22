import type { ScopedDbClient } from "@bibi/db";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import { asFieldValues } from "./field-usage";

export type FieldInfo = { key: string; name: string };

/** Prisma `include` for a typed record's type name, active field names and `LINK` values. */
export const TYPE_FIELDS_INCLUDE = {
  entityType: {
    select: {
      name: true,
      fields: { where: { status: "ACTIVE" as const }, select: { key: true, name: true } },
    },
  },
  ...WITH_RECORD_LINKS,
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

/** "Field name: value" lines for search text; list value ids become names. */
export function fieldSearchLines({ fields, stored, names }: FieldSearchLinesInput): string[] {
  const values = asFieldValues({ value: stored });
  return fields
    .map((field) => fieldLine({ field, value: values[field.key], names }))
    .filter((line): line is string => line !== null);
}

export type LoadValueNamesInput = { db: ScopedDbClient; rows: readonly WithRecordLinks[] };

/**
 * Names of the list values the rows' field values refer to (archived included). Lists are
 * shared vocabulary; linked records (LINK fields) belong to their own feature, so their names
 * never enter another entity's search text (ADR 0050, feature scope) and stay ids.
 */
export async function loadValueNames({
  db,
  rows,
}: LoadValueNamesInput): Promise<ReadonlyMap<string, string>> {
  const ids = rows.flatMap((row) =>
    Object.values(recordFields({ row }))
      .flat()
      .filter((v) => typeof v === "string"),
  );
  const values = await db.vocabularyValue.findMany({
    where: { id: { in: ids }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true, name: true },
  });
  return new Map(values.map((r) => [r.id, r.name]));
}
