import type { EntityTypeDto, FieldDefinitionDto, VocabularyDto } from "@okazi/core";

export const MAX_ORG_SECTION_CHARS = 4000;
const TRUNCATED = "(truncated, use entityType_list)";

export type DescribeOrgFieldsInput = {
  types: readonly EntityTypeDto[];
  vocabularies: readonly VocabularyDto[];
  maxChars?: number;
};

type AllowedInput = { field: FieldDefinitionDto; vocabularies: readonly VocabularyDto[] };

/** Allowed values of a choice field: `name=id` for list-backed fields, plain options otherwise. */
function allowedValues({ field, vocabularies }: AllowedInput): string {
  if (field.kind !== "CHOICE" && field.kind !== "MULTI_CHOICE") return "";
  if (field.vocabularyId) {
    const list = vocabularies.find((vocabulary) => vocabulary.id === field.vocabularyId);
    const values = (list?.values ?? []).map((value) => `${value.name}=${value.id}`);
    return `: ${values.join(", ")}`;
  }
  return field.options.length > 0 ? `: ${field.options.join(", ")}` : "";
}

function describeField({ field, vocabularies }: AllowedInput): string {
  const required = field.required ? ", required" : "";
  return `${field.key} (${field.name}, ${field.kind}${required}${allowedValues({ field, vocabularies })})`;
}

type TypeLineInput = { type: EntityTypeDto; vocabularies: readonly VocabularyDto[] };

function describeType({ type, vocabularies }: TypeLineInput): string {
  const behaviours = type.behaviours.length > 0 ? ` [${type.behaviours.join(", ")}]` : "";
  const fields = type.fields.map((field) => describeField({ field, vocabularies }));
  return `- ${type.name} (entityTypeId=${type.id})${behaviours}: ${fields.join("; ") || "no own fields"}`;
}

type CutInput = { lines: string[]; maxChars: number };

function capLines({ lines, maxChars }: CutInput): string[] {
  const kept: string[] = [];
  let size = 0;
  for (const line of lines) {
    if (size + line.length + 1 > maxChars - TRUNCATED.length) return [...kept, TRUNCATED];
    kept.push(line);
    size += line.length + 1;
  }
  return kept;
}

/**
 * The organization's own item types and fields as a compact section for tool descriptions
 * (ADR 0021). Empty string when the organization has no item types yet.
 */
export function describeOrgFields({
  types,
  vocabularies,
  maxChars = MAX_ORG_SECTION_CHARS,
}: DescribeOrgFieldsInput): string {
  if (types.length === 0) return "";
  const header =
    "This organization's item types and fields (use the field key inside `fields`; " +
    "choice values are `name=id`, pass the id for list-backed fields):";
  const lines = types.map((type) => describeType({ type, vocabularies }));
  return [header, ...capLines({ lines, maxChars: maxChars - header.length - 1 })].join("\n");
}
