import type { Item } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { isChoiceKind } from "../field-definition/field-kinds";
import { asFieldValues } from "../field-definition/field-usage";

type Db = Pick<OperationContext, "db">;

export type TagValue = { valueId: string; vocabularyId: string; name: string };

/** The list-backed fields per item type and the active list values they can hold. */
export type TagCatalog = {
  /** Item type id → keys of its fields that choose from a list. */
  keys: ReadonlyMap<string, readonly string[]>;
  /** Active list values by id, in list order. */
  values: ReadonlyMap<string, TagValue>;
};

export type LoadTagCatalogInput = { context: Db; entityTypeIds: readonly string[] };

/**
 * Tags are not rows of their own but the values of fields that choose from a list (ADR 0026).
 * Fields with inline options do not count. Archived fields and values are hidden by the client.
 */
export async function loadTagCatalog({
  context,
  entityTypeIds,
}: LoadTagCatalogInput): Promise<TagCatalog> {
  const fields = await context.db.fieldDefinition.findMany({
    where: { entityTypeId: { in: [...entityTypeIds] }, vocabularyId: { not: null } },
    select: { entityTypeId: true, key: true, kind: true, vocabularyId: true },
  });
  const listFields = fields.filter((field) => isChoiceKind({ kind: field.kind }));
  const rows = await context.db.vocabularyValue.findMany({
    where: { vocabularyId: { in: listFields.map((field) => field.vocabularyId as string) } },
    orderBy: [{ vocabularyId: "asc" }, { position: "asc" }, { id: "asc" }],
    select: { id: true, vocabularyId: true, name: true },
  });
  const keys = new Map<string, string[]>();
  for (const field of listFields) {
    keys.set(field.entityTypeId, [...(keys.get(field.entityTypeId) ?? []), field.key]);
  }
  const values = new Map(
    rows.map((row) => [
      row.id,
      { valueId: row.id, vocabularyId: row.vocabularyId, name: row.name },
    ]),
  );
  return { keys, values };
}

export type OwnTagsInput = { catalog: TagCatalog; item: Item };

/** Ids of the active list values the item itself carries, in list order. */
export function ownTags({ catalog, item }: OwnTagsInput): string[] {
  const fields = asFieldValues({ value: item.fields });
  const carried = new Set(
    (catalog.keys.get(item.entityTypeId) ?? []).flatMap((key) => {
      const value = fields[key];
      return Array.isArray(value) ? value : [value];
    }),
  );
  return [...catalog.values.keys()].filter((id) => carried.has(id));
}
