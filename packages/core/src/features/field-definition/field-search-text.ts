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

function fieldLine({ field, value, names }: FieldLineInput): string | null {
  const values = (Array.isArray(value) ? value : [value]).map((v) =>
    typeof v === "string"
      ? (names.get(v) ?? v)
      : typeof v === "boolean"
        ? v
          ? "ja"
          : "nej"
        : String(v),
  );
  return value === undefined ? null : `${field.name}: ${values.join(", ")}`;
}

export type FieldSearchLinesInput = {
  fields: readonly FieldInfo[];
  stored: unknown;
  names: ReadonlyMap<string, string>;
};

/** "Field name: value" lines for search text; list value ids become their names. */
export function fieldSearchLines({ fields, stored, names }: FieldSearchLinesInput): string[] {
  const values = asFieldValues({ value: stored });
  return fields
    .map((field) => fieldLine({ field, value: values[field.key], names }))
    .filter((line): line is string => line !== null);
}

export type LoadValueNamesInput = { db: ScopedDbClient; rows: readonly { fields: unknown }[] };

/** Names of the list values the rows' field values refer to (archived values included). */
export async function loadValueNames({
  db,
  rows,
}: LoadValueNamesInput): Promise<ReadonlyMap<string, string>> {
  const valueIds = rows.flatMap((row) =>
    Object.values(asFieldValues({ value: row.fields }))
      .flat()
      .filter((v) => typeof v === "string"),
  );
  const values = await db.vocabularyValue.findMany({
    where: { id: { in: valueIds }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true, name: true },
  });
  return new Map(values.map((value) => [value.id, value.name]));
}
