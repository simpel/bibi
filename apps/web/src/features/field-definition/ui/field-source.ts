import type { FieldDefinitionDto } from "@bibi/core";
import type { useTranslations } from "next-intl";
import type { VocabularyChoice } from "./field-source-fields";

export type FieldSourceInput = {
  field: FieldDefinitionDto;
  vocabularies: VocabularyChoice[];
  linkTypes: VocabularyChoice[];
  t: ReturnType<typeof useTranslations<"fieldDefinition">>;
};

/** Where the field's alternatives come from: a list, linked records, own options, or "–". */
export function fieldSource({ field, vocabularies, linkTypes, t }: FieldSourceInput): string {
  const list = vocabularies.find(({ id }) => id === field.vocabularyId);
  if (list) return t("listSource", { name: list.name });
  const target = linkTypes.find(({ id }) => id === field.linkTypeId);
  if (target) return t("linkSource", { name: target.name });
  return field.options.length > 0 ? t("optionsSource", { count: field.options.length }) : "–";
}
