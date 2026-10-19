import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields } from "../field-definition/field-values";
import { checkItem } from "./check-item";
import { itemEmbeddable } from "./embeddable";
import { insertItem } from "./insert-item";
import { planComposition, writeComposition } from "./item-composition";
import { loadItemType } from "./item-rules";
import { replaceSetups } from "./item-setups";
import { ItemCreateInputSchema, ItemSchema, ItemUpdateInputSchema } from "./schema";
import { loadItem } from "./to-item-dto";
import { itemUpdateConsequences } from "./update-consequences";

export const createItem = defineOperation({
  name: "item.create",
  kind: "command",
  description:
    "Create an item of one of the organization's item types. Behaviour data (price, default " +
    "length, setup capacities, parts, choice groups) is only accepted if the type has that " +
    "behaviour; `fields` must match the type's own fields. The item joins the catalog; use " +
    "item.saveAsPackage for a customer-specific package.",
  input: ItemCreateInputSchema,
  output: ItemSchema,
  permission: "item:create",
  embeddable: itemEmbeddable,
  handler: ({ input, context }) => insertItem({ context, input, customerId: null }),
});

export const updateItem = defineOperation({
  name: "item.update",
  kind: "command",
  description:
    "Update an item. Omitted properties are unchanged; `fields` is merged by key (null " +
    "clears a value); `setups`, `components` and `choiceGroups` replace the whole set (groups " +
    "are kept when only parts change). The type cannot be changed.",
  input: ItemUpdateInputSchema,
  output: ItemSchema,
  permission: "item:edit",
  embeddable: itemEmbeddable,
  consequences: itemUpdateConsequences,
  handler: async ({ input, context }) => {
    const { id, fields: patch, setups, components, choiceGroups, ...data } = input;
    const before = await loadItem({ context, id });
    if (!before) return notFound({ entity: "Item" });
    const type = await loadItemType({ context, entityTypeId: before.entityTypeId });
    if (!type.ok) return type;
    const composition = planComposition({ before, components, choiceGroups });
    const checked = await checkItem({
      context,
      type: type.value,
      itemId: id,
      customerId: before.customerId,
      data: { ...data, setups, components, choiceGroups },
      composition,
      fields: patch ? mergeFields({ before: before.fields, patch }) : undefined,
    });
    if (!checked.ok) return checked;
    const json = checked.value ? toJson({ value: checked.value }) : undefined;
    await context.db.item.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
    });
    if (setups) await replaceSetups({ context, itemId: id, setups });
    const partsChanged = components !== undefined;
    await writeComposition({ context, itemId: id, partsChanged, composition });
    const item = await loadItem({ context, id });
    if (!item) return notFound({ entity: "Item" });
    context.recordChange({ entityId: id, before, after: item });
    return ok({ value: item });
  },
});
