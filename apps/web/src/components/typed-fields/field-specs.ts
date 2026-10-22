import type { EntityTypeDto, FieldDefinitionDto, VocabularyDto } from "@bibi/core";
import { type FieldSpec, isChoiceKind } from "@bibi/core/schemas";
import type { LinkTargets } from "./typed-form-data";

export type FieldChoice = { value: string; label: string };

export type ChoicesInput = {
  field: FieldDefinitionDto;
  vocabularies: VocabularyDto[];
  links?: LinkTargets;
};

/**
 * Allowed values of a choice field as the UI shows them: list values (by id) or own options.
 * A LINK field's values are the records of its target type (`links`).
 */
export function choicesOf({ field, vocabularies, links = {} }: ChoicesInput): FieldChoice[] | null {
  if (field.kind === "LINK") return field.linkTypeId ? (links[field.linkTypeId] ?? []) : [];
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
    linkTypeId: field.linkTypeId,
  }));
}
