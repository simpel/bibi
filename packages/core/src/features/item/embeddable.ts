import type { Item } from "@okazi/db";
import type { Embeddable } from "../../search/embeddable";
import {
  type FieldInfo,
  fieldSearchLines,
  loadValueNames,
  TYPE_FIELDS_INCLUDE,
} from "../field-definition/field-search-text";

/** An item with what its search text needs: type, venue, field names and list value names. */
export type IndexedItem = Item & {
  entityType: { name: string; fields: FieldInfo[] };
  venue: { name: string; city: string | null } | null;
  valueNames: ReadonlyMap<string, string>;
};

export const itemEmbeddable: Embeddable<IndexedItem> = {
  entityType: "item",
  readPermission: "item:read",
  toText: ({ entity }) =>
    [
      entity.name,
      entity.entityType.name,
      entity.description,
      ...fieldSearchLines({
        fields: entity.entityType.fields,
        stored: entity.fields,
        names: entity.valueNames,
      }),
      entity.venue ? [entity.venue.name, entity.venue.city].filter(Boolean).join(", ") : null,
    ]
      .filter(Boolean)
      .join("\n"),
  load: async ({ ids, db }) => {
    const items = await db.item.findMany({
      where: { id: { in: [...ids] } },
      include: { ...TYPE_FIELDS_INCLUDE, venue: { select: { name: true, city: true } } },
    });
    const valueNames = await loadValueNames({ db, rows: items });
    return items.map((item) => ({ ...item, valueNames }));
  },
};
