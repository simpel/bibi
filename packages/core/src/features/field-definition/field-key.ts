import type { OperationContext } from "../../operations/types";

const LETTERS: Record<string, string> = {
  "\u00e5": "a",
  "\u00e4": "a",
  "\u00f6": "o",
  "\u00e9": "e",
  "\u00fc": "u",
  "\u00b2": "2",
};

export type ToFieldKeyInput = { name: string };

/** "Area m²" → "area_m2", "Ceiling height m" → "ceiling_height_m". Always a valid `FieldKeySchema`. */
export function toFieldKey({ name }: ToFieldKeyInput): string {
  const ascii = [...name.toLowerCase()].map((char) => LETTERS[char] ?? char).join("");
  const slug = ascii.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const key = /^[a-z]/.test(slug) ? slug : `f_${slug}`;
  return key.slice(0, 36).replace(/_+$/, "") || "field";
}

export type FreeFieldKeyInput = {
  context: Pick<OperationContext, "db">;
  entityTypeId: string;
  base: string;
};

/**
 * `base`, or `base_2`, `base_3`… if taken. Keys stay unique per type even among archived
 * fields, so old values can never be read as a new field's.
 */
export async function freeFieldKey({
  context,
  entityTypeId,
  base,
}: FreeFieldKeyInput): Promise<string> {
  const rows = await context.db.fieldDefinition.findMany({
    where: { entityTypeId, key: { startsWith: base }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { key: true },
  });
  const used = new Set(rows.map((row) => row.key));
  let key = base;
  for (let n = 2; used.has(key); n++) key = `${base}_${n}`;
  return key;
}
