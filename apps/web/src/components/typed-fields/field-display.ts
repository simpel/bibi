import type { FieldDefinitionDto, VocabularyDto } from "@okazi/core";
import { choicesOf } from "./field-specs";
import type { LinkTargets } from "./typed-form-data";

export type DisplayInput = {
  field: FieldDefinitionDto;
  value: unknown;
  vocabularies: VocabularyDto[];
  /** Records LINK fields point to, so a link shows the record's name. */
  links?: LinkTargets;
  /** Localized yes/no for BOOLEAN fields. */
  yesNo: { yes: string; no: string };
};

/** A stored field value as text: list value and linked record ids become names, booleans yes/no. */
export function displayValue({ field, value, vocabularies, links, yesNo }: DisplayInput): string {
  if (value === undefined || value === null) return "–";
  if (field.kind === "BOOLEAN") return value === true ? yesNo.yes : yesNo.no;
  const choices = choicesOf({ field, vocabularies, ...(links ? { links } : {}) }) ?? [];
  const labels = ([] as unknown[])
    .concat(value)
    .map((choice) => choices.find(({ value: id }) => id === choice)?.label ?? String(choice));
  return labels.join(", ");
}
