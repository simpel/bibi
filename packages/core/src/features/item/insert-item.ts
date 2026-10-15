import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { checkItem } from "./check-item";
import { planComposition, writeComposition } from "./item-composition";
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

/** Checks and creates an item with its setups, parts and choice groups, and records it for audit. */
export async function insertItem({
  context,
  input: { entityTypeId, fields, setups, components, choiceGroups, ...data },
  customerId,
}: InsertItemInput): Promise<Result<ItemDto>> {
  const type = await loadItemType({ context, entityTypeId });
  if (!type.ok) return type;
  const composition = planComposition({ components, choiceGroups });
  const checked = await checkItem({
    context,
    type: type.value,
    customerId,
    data: { ...data, setups, components, choiceGroups },
    composition,
    fields: fields ?? {},
  });
  if (!checked.ok) return checked;
  const row = await context.db.item.create({
    data: {
      ...data,
      entityTypeId,
      customerId,
      fields: toJson({ value: checked.value ?? {} }) ?? {},
      organizationId: context.organizationId,
    },
  });
  if (setups) await replaceSetups({ context, itemId: row.id, setups });
  await writeComposition({ context, itemId: row.id, partsChanged: true, composition });
  const item = await loadItem({ context, id: row.id });
  if (!item) return notFound({ entity: "Item" });
  context.recordChange({ entityId: row.id, after: item });
  return ok({ value: item });
}
