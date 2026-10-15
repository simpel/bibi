import type { EntityTypeDto, VocabularyDto } from "@okazi/core";
import type { Fact } from "./fact-list";
import { displayValue } from "./field-display";

export type OwnFieldFactsInput = {
  type: EntityTypeDto | undefined;
  stored: Record<string, unknown>;
  vocabularies: VocabularyDto[];
  yesNo: { yes: string; no: string };
};

/** One fact per own field of the type, with the record's stored value as text. */
export function ownFieldFacts({ type, stored, vocabularies, yesNo }: OwnFieldFactsInput): Fact[] {
  return (type?.fields ?? []).map((field) => ({
    label: field.name,
    value: displayValue({ field, value: stored[field.key], vocabularies, yesNo }),
  }));
}
