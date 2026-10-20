import type { Customer } from "@okazi/db";
import type { Embeddable } from "../../search/embeddable";
import {
  type FieldInfo,
  fieldSearchLines,
  loadValueNames,
  TYPE_FIELDS_INCLUDE,
} from "../field-definition/field-search-text";

/** A customer with what its search text needs: type, field names and list value names. */
export type IndexedCustomer = Customer & {
  entityType: { name: string; fields: FieldInfo[] };
  valueNames: ReadonlyMap<string, string>;
};

export const customerEmbeddable: Embeddable<IndexedCustomer> = {
  entityType: "customer",
  readPermission: "customer:read",
  toText: ({ entity }) =>
    [
      entity.name,
      entity.entityType.name,
      entity.email,
      entity.phone,
      [entity.invoiceStreetAddress, entity.invoicePostalCode, entity.invoiceCity]
        .filter(Boolean)
        .join(", "),
      ...fieldSearchLines({
        fields: entity.entityType.fields,
        stored: entity.fields,
        names: entity.valueNames,
      }),
    ]
      .filter(Boolean)
      .join("\n"),
  load: async ({ ids, db }) => {
    const rows = await db.customer.findMany({
      where: { id: { in: [...ids] } },
      include: TYPE_FIELDS_INCLUDE,
    });
    const valueNames = await loadValueNames({ db, rows });
    return rows.map((row) => ({ ...row, valueNames }));
  },
};
