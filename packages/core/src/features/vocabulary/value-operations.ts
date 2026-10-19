import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { usageConflict } from "../../records/blocking-issues";
import { conflict, notFound } from "../../shared/errors";
import { loadVocabulary } from "./load-vocabulary";
import {
  VocabularyAddValueInputSchema,
  VocabularyArchiveValueInputSchema,
  VocabularySchema,
  VocabularyUpdateValueInputSchema,
} from "./schema";
import { recordsUsingValue } from "./usage";

const VALUE = "vocabularyValue";

export const addVocabularyValue = defineOperation({
  name: "vocabulary.addValue",
  kind: "command",
  description: "Add a value to a list. Returns the whole list.",
  input: VocabularyAddValueInputSchema,
  output: VocabularySchema,
  permission: "configuration:write",
  entityType: VALUE,
  handler: async ({ input: { vocabularyId, name, position }, context }) => {
    const list = await loadVocabulary({ context, id: vocabularyId });
    if (!list) return notFound({ entity: "List" });
    if (list.values.some((value) => value.name === name)) {
      return conflict({ message: `The list already has "${name}"` });
    }
    const last = list.values.at(-1)?.position ?? -1;
    const row = await context.db.vocabularyValue.create({
      data: {
        vocabularyId,
        name,
        position: position ?? last + 1,
        organizationId: context.organizationId,
      },
    });
    context.recordChange({ entityId: row.id, after: row });
    return ok({ value: (await loadVocabulary({ context, id: vocabularyId })) ?? list });
  },
});

export const updateVocabularyValue = defineOperation({
  name: "vocabulary.updateValue",
  kind: "command",
  description: "Rename or move a list value. Items keep the value (they store its id).",
  input: VocabularyUpdateValueInputSchema,
  output: VocabularySchema,
  permission: "configuration:write",
  entityType: VALUE,
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await context.db.vocabularyValue.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "List value" });
    const row = await context.db.vocabularyValue.update({ where: { id }, data });
    context.recordChange({ entityId: id, before, after: row });
    const list = await loadVocabulary({ context, id: row.vocabularyId });
    return list ? ok({ value: list }) : notFound({ entity: "List" });
  },
});

export const archiveVocabularyValue = defineOperation({
  name: "vocabulary.archiveValue",
  kind: "command",
  description:
    "Archive a list value. Refused while a record still carries it or a requirement counts it.",
  input: VocabularyArchiveValueInputSchema,
  output: VocabularySchema,
  permission: "configuration:write",
  entityType: VALUE,
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.vocabularyValue.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "List value" });
    const vocabularyId = before.vocabularyId;
    const usage = await recordsUsingValue({ context, vocabularyId, valueId: id });
    const message = `${usage.total} records carry "${before.name}"`;
    if (usage.total > 0) return usageConflict({ context, usage, message });
    const row = await context.db.vocabularyValue.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({ entityId: id, before, after: row });
    const list = await loadVocabulary({ context, id: vocabularyId });
    return list ? ok({ value: list }) : notFound({ entity: "List" });
  },
});
