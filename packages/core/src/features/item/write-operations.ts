import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { checkItem } from "./check-item";
import { itemEmbeddable } from "./embeddable";
import { replaceComponents } from "./item-components";
import { mergeFields } from "./item-fields";
import { loadItemType } from "./item-rules";
import { replaceSetups } from "./item-setups";
import { ItemCreateInputSchema, ItemSchema, ItemUpdateInputSchema } from "./schema";
import { loadItem } from "./to-item-dto";

export const createItem = defineOperation({
  name: "item.create",
  kind: "command",
  description:
    "Create an item of one of the organization's item types. Behaviour data (price, default " +
    "length, setup capacities, parts) is only accepted if the type has that behaviour; `fields` " +
    "must match the type's own fields.",
  input: ItemCreateInputSchema,
  output: ItemSchema,
  permission: "item:write",
  embeddable: itemEmbeddable,
  handler: async ({ input: { entityTypeId, fields, setups, components, ...data }, context }) => {
    const type = await loadItemType({ context, entityTypeId });
    if (!type.ok) return type;
    const checked = await checkItem({
      context,
      type: type.value,
      data: { ...data, setups, components },
      fields: fields ?? {},
    });
    if (!checked.ok) return checked;
    const row = await context.db.item.create({
      data: {
        ...data,
        entityTypeId,
        fields: toJson({ value: checked.value ?? {} }) ?? {},
        organizationId: context.organizationId,
      },
    });
    if (setups) await replaceSetups({ context, itemId: row.id, setups });
    if (components) await replaceComponents({ context, itemId: row.id, components });
    const item = await loadItem({ context, id: row.id });
    if (!item) return notFound({ entity: "Item" });
    context.recordChange({ entityId: row.id, after: item });
    return ok({ value: item });
  },
});

export const updateItem = defineOperation({
  name: "item.update",
  kind: "command",
  description:
    "Update an item. Omitted properties are unchanged; `fields` is merged by key (null " +
    "clears a value); `setups` and `components` replace the whole set. The type cannot be changed.",
  input: ItemUpdateInputSchema,
  output: ItemSchema,
  permission: "item:write",
  embeddable: itemEmbeddable,
  handler: async ({ input: { id, fields: patch, setups, components, ...data }, context }) => {
    const before = await loadItem({ context, id });
    if (!before) return notFound({ entity: "Item" });
    const type = await loadItemType({ context, entityTypeId: before.entityTypeId });
    if (!type.ok) return type;
    const fields = patch ? mergeFields({ before: before.fields, patch }) : undefined;
    const checked = await checkItem({
      context,
      type: type.value,
      itemId: id,
      data: { ...data, setups, components },
      fields,
    });
    if (!checked.ok) return checked;
    const json = checked.value ? toJson({ value: checked.value }) : undefined;
    await context.db.item.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
    });
    if (setups) await replaceSetups({ context, itemId: id, setups });
    if (components) await replaceComponents({ context, itemId: id, components });
    const item = await loadItem({ context, id });
    if (!item) return notFound({ entity: "Item" });
    context.recordChange({ entityId: id, before, after: item });
    return ok({ value: item });
  },
});
