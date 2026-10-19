import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { usageConflict } from "../../records/blocking-issues";
import { conflict, notFound } from "../../shared/errors";
import { checkNotOnSheets } from "../sheet-definition/usage";
import { checkChoiceSource, checkFieldChange } from "./field-rules";
import { recordsWithValue } from "./field-value-usage";
import { insertField } from "./insert-field";
import { checkLinkTarget } from "./link-rules";
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
    "Add a field to one of the organization's types, e.g. Area m² (NUMBER) on Conference room or " +
    "Allergens (MULTI_CHOICE from the list Allergens) on Dish, or Account manager (LINK to a " +
    "contact type) on Customer.",
  input: FieldDefinitionCreateInputSchema,
  output: FieldDefinitionSchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertField({ context, input }),
});

export const updateFieldDefinition = defineOperation({
  name: "fieldDefinition.update",
  kind: "command",
  description:
    "Change a field. The key never changes. Changing kind, list or link target, removing used " +
    "options or making it required while records lack a value is refused (CONFLICT).",
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
    const link = await checkLinkTarget({ context, entityTypeId, source: next });
    if (!link.ok) return link;
    const change = await checkFieldChange({ context, before, next });
    if (!change.ok) return change;
    const named = data.name
      ? await context.db.fieldDefinition.findFirst({ where: { entityTypeId, name: data.name } })
      : null;
    if (named && named.id !== id)
      return conflict({ message: `The type has a field "${data.name}"` });
    const field = await context.db.fieldDefinition.update({ where: { id }, data });
    context.recordChange({ entityId: id, before, after: field });
    return ok({ value: field });
  },
});

export const archiveFieldDefinition = defineOperation({
  name: "fieldDefinition.archive",
  kind: "command",
  description:
    "Archive a field. Refused while a record has a value for it (clear those first) or a sheet " +
    "definition includes it.",
  input: FieldDefinitionIdInputSchema,
  output: FieldDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.fieldDefinition.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Field" });
    const usage = await recordsWithValue({ context, field: before, presence: "has" });
    const message = `${usage.total} records have a value for ${before.name}`;
    if (usage.total > 0) return usageConflict({ context, usage, message });
    const what = `The field ${before.name}`;
    const onSheets = await checkNotOnSheets({ context, reference: { fieldId: id }, what });
    if (!onSheets.ok) return onSheets;
    const field = await context.db.fieldDefinition.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({ entityId: id, before, after: field });
    return ok({ value: field });
  },
});
