import type { Item } from "@okazi/db";
import type { Embeddable } from "../../search/embeddable";
import {
  type FieldInfo,
  fieldSearchLines,
  loadValueNames,
  TYPE_FIELDS_INCLUDE,
} from "../field-definition/field-search-text";

/**
 * An item with what its search text needs: type, field names and list value names. Only the
 * item's own data: the venue is another feature's record (ADR 0050, feature scope).
 */
export type IndexedItem = Item & {
  entityType: { name: string; fields: FieldInfo[] };
  valueNames: ReadonlyMap<string, string>;
};

export const itemEmbeddable: Embeddable<IndexedItem> = {
  entityType: "item",
  readPermission: "item:view",
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
    ]
      .filter(Boolean)
      .join("\n"),
  load: async ({ ids, db }) => {
    const items = await db.item.findMany({
      where: { id: { in: [...ids] } },
      include: TYPE_FIELDS_INCLUDE,
    });
    const valueNames = await loadValueNames({ db, rows: items });
    return items.map((item) => ({ ...item, valueNames }));
  },
};
