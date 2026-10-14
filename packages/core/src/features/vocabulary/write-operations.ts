import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { getVocabularyTemplate } from "../../templates/vocabularies/vocabulary-templates";
import { insertVocabulary } from "./insert-vocabulary";
import { findVocabularyByName, toVocabularyDto } from "./load-vocabulary";
import {
  VocabularyCreateInputSchema,
  VocabularyIdInputSchema,
  VocabularyImportTemplateInputSchema,
  VocabularySchema,
  VocabularyUpdateInputSchema,
} from "./schema";
import { listFieldsUsing } from "./usage";

export const createVocabulary = defineOperation({
  name: "vocabulary.create",
  kind: "command",
  description: "Create a list with optional initial values. List names are unique.",
  input: VocabularyCreateInputSchema,
  output: VocabularySchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertVocabulary({ context, ...input }),
});

export const updateVocabulary = defineOperation({
  name: "vocabulary.update",
  kind: "command",
  description: "Rename a list. Values are changed with vocabulary.addValue/updateValue.",
  input: VocabularyUpdateInputSchema,
  output: VocabularySchema,
  permission: "configuration:write",
  handler: async ({ input: { id, name }, context }) => {
    const before = await context.db.vocabulary.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "List" });
    const taken = await findVocabularyByName({ context, name });
    if (taken && taken.id !== id) return conflict({ message: `A list named "${name}" exists` });
    const row = await context.db.vocabulary.update({ where: { id }, data: { name } });
    const vocabulary = await toVocabularyDto({ context, row });
    context.recordChange({ entityId: id, before, after: vocabulary });
    return ok({ value: vocabulary });
  },
});

export const archiveVocabulary = defineOperation({
  name: "vocabulary.archive",
  kind: "command",
  description: "Archive a list. Refused while a field still picks values from it.",
  input: VocabularyIdInputSchema,
  output: VocabularySchema,
  permission: "configuration:write",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.vocabulary.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "List" });
    const fields = await listFieldsUsing({ context, vocabularyId: id });
    if (fields.length > 0) {
      const names = fields.map((field) => field.name).join(", ");
      return conflict({ message: `The list is used by the fields ${names}` });
    }
    const row = await context.db.vocabulary.update({ where: { id }, data: { status: "ARCHIVED" } });
    const vocabulary = await toVocabularyDto({ context, row });
    context.recordChange({ entityId: id, before, after: vocabulary });
    return ok({ value: vocabulary });
  },
});

export const importVocabularyTemplate = defineOperation({
  name: "vocabulary.importTemplate",
  kind: "command",
  description:
    "Import a list template (e.g. eu-14-allergens) as an ordinary, editable list. " +
    "Refused if a list with the template's name exists.",
  input: VocabularyImportTemplateInputSchema,
  output: VocabularySchema,
  permission: "configuration:write",
  handler: ({ input, context }) => {
    const { name, values } = getVocabularyTemplate({ key: input.template });
    return insertVocabulary({ context, name, values: [...values] });
  },
});
