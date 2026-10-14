import type { Item } from "@okazi/db";
import type { Embeddable } from "../../search/embeddable";
import { asFieldValues } from "../field-definition/field-usage";

type FieldInfo = { key: string; name: string };

/** An item with what its search text needs: type, venue, field names and list value names. */
export type IndexedItem = Item & {
  entityType: { name: string; fields: FieldInfo[] };
  venue: { name: string; city: string | null } | null;
  valueNames: ReadonlyMap<string, string>;
};

type FieldLineInput = { field: FieldInfo; value: unknown; names: ReadonlyMap<string, string> };

function fieldLine({ field, value, names }: FieldLineInput): string | null {
  const values = (Array.isArray(value) ? value : [value]).map((v) =>
    typeof v === "string" ? (names.get(v) ?? v) : typeof v === "boolean" ? (v ? "ja" : "nej") : String(v),
  );
  return value === undefined ? null : `${field.name}: ${values.join(", ")}`;
}

export const itemEmbeddable: Embeddable<IndexedItem> = {
  entityType: "item",
  toText: ({ entity }) => {
    const values = asFieldValues({ value: entity.fields });
    return [
      entity.name,
      entity.entityType.name,
      entity.description,
      ...entity.entityType.fields.map((field) =>
        fieldLine({ field, value: values[field.key], names: entity.valueNames }),
      ),
      entity.venue ? [entity.venue.name, entity.venue.city].filter(Boolean).join(", ") : null,
    ]
      .filter(Boolean)
      .join("\n");
  },
  load: async ({ ids, db }) => {
    const items = await db.item.findMany({
      where: { id: { in: [...ids] } },
      include: {
        entityType: {
          select: { name: true, fields: { where: { status: "ACTIVE" }, select: { key: true, name: true } } },
        },
        venue: { select: { name: true, city: true } },
      },
    });
    const valueIds = items.flatMap((item) =>
      Object.values(asFieldValues({ value: item.fields })).flat().filter((v) => typeof v === "string"),
    );
    const values = await db.vocabularyValue.findMany({
      where: { id: { in: valueIds }, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { id: true, name: true },
    });
    const valueNames = new Map(values.map((value) => [value.id, value.name]));
    return items.map((item) => ({ ...item, valueNames }));
  },
};
