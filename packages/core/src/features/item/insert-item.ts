import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import type { CheckedFields } from "../field-definition/split-links";
import { checkItem } from "./check-item";
import { replaceCustomisationGroups } from "./item-customisation-groups";
import { replaceParts } from "./item-parts";
import { loadItemType } from "./item-rules";
import { replaceSetups } from "./item-setups";
import type { ItemCreateInput, ItemDto } from "./schema";
import { loadItem } from "./to-item-dto";

export type InsertItemInput = {
  context: OperationContext;
  input: ItemCreateInput;
  /** The owning customer; null = a catalog item. */
  customerId: string | null;
};

type ItemRowInput = {
  context: OperationContext;
  data: Omit<ItemCreateInput, "fields" | "setups" | "parts" | "customisationGroups"> & {
    customerId: string | null;
  };
  fields: CheckedFields;
};

/** Writes the item's row and its `Record` row (ADR 0056). */
const insertItemRow = ({ context, data, fields }: ItemRowInput) =>
  createRecord({
    context,
    base: "ITEM",
    entityTypeId: data.entityTypeId,
    ...fields,
    insert: ({ id }) =>
      context.db.item.create({
        data: {
          ...{ id, ...data, fields: toJson({ value: fields.fields }) ?? {} },
          organizationId: context.organizationId,
        },
      }),
  });

/** Checks and creates an item with its setups, parts and customisation groups, and records it for audit. */
export async function insertItem({
  context,
  input: { entityTypeId, fields, setups, parts, customisationGroups, ...data },
  customerId,
}: InsertItemInput): Promise<Result<ItemDto>> {
  const type = await loadItemType({ context, entityTypeId });
  if (!type.ok) return type;
  const checked = await checkItem({
    context,
    type: type.value,
    customerId,
    data: { ...data, setups, parts, customisationGroups },
    fields: fields ?? {},
  });
  if (!checked.ok) return checked;
  const row = await insertItemRow({
    context,
    data: { ...data, entityTypeId, customerId },
    fields: checked.value ?? { fields: {}, links: [] },
  });
  if (setups) await replaceSetups({ context, itemId: row.id, setups });
  if (parts) await replaceParts({ context, itemId: row.id, parts });
  if (customisationGroups) {
    await replaceCustomisationGroups({ context, itemId: row.id, customisationGroups });
  }
  const item = await loadItem({ context, id: row.id });
  if (!item) return notFound({ entity: "Item" });
  context.recordChange({ entityId: row.id, after: item });
  return ok({ value: item });
}
