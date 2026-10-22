import type { EntityTypeDto, VocabularyDto } from "@bibi/core";
import type { Fact } from "./fact-list";
import { displayValue } from "./field-display";
import type { LinkTargets } from "./typed-form-data";

export type OwnFieldFactsInput = {
  type: EntityTypeDto | undefined;
  stored: Record<string, unknown>;
  vocabularies: VocabularyDto[];
  links: LinkTargets;
  yesNo: { yes: string; no: string };
};

/** One fact per own field of the type, with the record's stored value as text. */
export function ownFieldFacts({
  type,
  stored,
  vocabularies,
  links,
  yesNo,
}: OwnFieldFactsInput): Fact[] {
  return (type?.fields ?? []).map((field) => ({
    label: field.name,
    value: displayValue({ field, value: stored[field.key], vocabularies, links, yesNo }),
  }));
}
