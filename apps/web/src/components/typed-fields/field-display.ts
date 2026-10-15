import type { FieldDefinitionDto, VocabularyDto } from "@okazi/core";
import { choicesOf } from "./field-specs";

export type DisplayInput = {
  field: FieldDefinitionDto;
  value: unknown;
  vocabularies: VocabularyDto[];
  /** Localized yes/no for BOOLEAN fields. */
  yesNo: { yes: string; no: string };
};

/** A stored field value as text: list value ids become names, booleans become yes/no. */
export function displayValue({ field, value, vocabularies, yesNo }: DisplayInput): string {
  if (value === undefined || value === null) return "–";
  if (field.kind === "BOOLEAN") return value === true ? yesNo.yes : yesNo.no;
  const choices = choicesOf({ field, vocabularies }) ?? [];
  const labels = ([] as unknown[])
    .concat(value)
    .map((choice) => choices.find(({ value: id }) => id === choice)?.label ?? String(choice));
  return labels.join(", ");
}
