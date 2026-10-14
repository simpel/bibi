import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { countItemsWithValue } from "./field-usage";
import { checkChoiceSource, checkFieldChange } from "./field-rules";
import { insertField } from "./insert-field";
import {
  FieldDefinitionCreateInputSchema,
  FieldDefinitionIdInputSchema,
  FieldDefinitionSchema,
  FieldDefinitionUpdateInputSchema,
} from "./schema";

export const createFieldDefinition = defineOperation({
  name: "fieldDefinition.create",
  kind: "command",
  description:
    "Add a field to one of the organization's types, e.g. Yta m² (NUMBER) on Konferensrum or " +
    "Allergener (MULTI_CHOICE from the list Allergener) on Rätt.",
  input: FieldDefinitionCreateInputSchema,
  output: FieldDefinitionSchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertField({ context, input }),
});

export const updateFieldDefinition = defineOperation({
  name: "fieldDefinition.update",
  kind: "command",
  description:
    "Change a field. The key never changes. Changing kind or list, removing used options or " +
    "making it required while items lack a value is refused (CONFLICT).",
  input: FieldDefinitionUpdateInputSchema,
  output: FieldDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await context.db.fieldDefinition.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Field" });
    const { entityTypeId } = before;
    const next = { ...before, ...data };
    const source = await checkChoiceSource({ context, source: next });
    if (!source.ok) return source;
    const change = await checkFieldChange({ context, before, next });
    if (!change.ok) return change;
    const named = data.name
      ? await context.db.fieldDefinition.findFirst({ where: { entityTypeId, name: data.name } })
      : null;
    if (named && named.id !== id) return conflict({ message: `The type has a field "${data.name}"` });
    const field = await context.db.fieldDefinition.update({ where: { id }, data });
    context.recordChange({ entityId: id, before, after: field });
    return ok({ value: field });
  },
});

export const archiveFieldDefinition = defineOperation({
  name: "fieldDefinition.archive",
  kind: "command",
  description: "Archive a field. Refused while an item has a value for it: clear those first.",
  input: FieldDefinitionIdInputSchema,
  output: FieldDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.fieldDefinition.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Field" });
    const { entityTypeId, key } = before;
    const used = await countItemsWithValue({ context, entityTypeId, key });
    if (used > 0) return conflict({ message: `${used} items have a value for ${before.name}` });
    const field = await context.db.fieldDefinition.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({ entityId: id, before, after: field });
    return ok({ value: field });
  },
});
