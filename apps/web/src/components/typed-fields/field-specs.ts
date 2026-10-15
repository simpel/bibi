import type { EntityTypeDto, FieldDefinitionDto, VocabularyDto } from "@okazi/core";
import { type FieldSpec, isChoiceKind } from "@okazi/core/schemas";

export type FieldChoice = { value: string; label: string };

export type ChoicesInput = { field: FieldDefinitionDto; vocabularies: VocabularyDto[] };

/** Allowed values of a choice field as the UI shows them: list values (by id) or own options. */
export function choicesOf({ field, vocabularies }: ChoicesInput): FieldChoice[] | null {
  if (!isChoiceKind({ kind: field.kind })) return null;
  if (field.vocabularyId) {
    const list = vocabularies.find(({ id }) => id === field.vocabularyId);
    return (list?.values ?? []).map(({ id, name }) => ({ value: id, label: name }));
  }
  return field.options.map((option) => ({ value: option, label: option }));
}

export type SpecsInput = { type: EntityTypeDto | undefined; vocabularies: VocabularyDto[] };

/** Field definitions of the type as `buildFieldsSchema` specs (choices = allowed values). */
export function specsOf({ type, vocabularies }: SpecsInput): FieldSpec[] {
  return (type?.fields ?? []).map((field) => ({
    key: field.key,
    name: field.name,
    kind: field.kind,
    required: field.required,
    choices: choicesOf({ field, vocabularies })?.map(({ value }) => value) ?? null,
  }));
}
