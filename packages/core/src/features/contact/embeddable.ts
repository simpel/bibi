import type { Contact } from "@bibi/db";
import { recordFields, type WithRecordLinks } from "../../records/record-links";
import type { Embeddable } from "../../search/embeddable";
import {
  type FieldInfo,
  fieldSearchLines,
  loadValueNames,
  TYPE_FIELDS_INCLUDE,
} from "../field-definition/field-search-text";

/** A contact with what its search text needs: type, customer name and field names. */
export type IndexedContact = Contact & {
  entityType: { name: string; fields: FieldInfo[] };
  record: WithRecordLinks["record"];
  customer: { name: string };
  valueNames: ReadonlyMap<string, string>;
};

export const contactEmbeddable: Embeddable<IndexedContact> = {
  entityType: "contact",
  isRecord: true,
  readPermission: "customer:read",
  toText: ({ entity }) =>
    [
      entity.name,
      entity.entityType.name,
      entity.customer.name,
      entity.email,
      entity.phone,
      ...fieldSearchLines({
        fields: entity.entityType.fields,
        stored: recordFields({ row: entity }),
        names: entity.valueNames,
      }),
    ]
      .filter(Boolean)
      .join("\n"),
  load: async ({ ids, db }) => {
    const rows = await db.contact.findMany({
      where: { id: { in: [...ids] } },
      include: { ...TYPE_FIELDS_INCLUDE, customer: { select: { name: true } } },
    });
    const valueNames = await loadValueNames({ db, rows });
    return rows.map((row) => ({ ...row, valueNames }));
  },
};
