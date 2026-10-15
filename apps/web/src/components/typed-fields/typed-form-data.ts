import type { EntityTypeDto, VocabularyDto } from "@okazi/core";

/** One record a LINK field can point to, as the UI shows it. */
export type LinkTarget = { value: string; label: string };

/** Records LINK fields can point to, by target type id (`linkTypeId`). */
export type LinkTargets = Record<string, LinkTarget[]>;

/**
 * What a typed record's form needs (ADR 0021): the base's types, the lists choices use and the
 * records LINK fields can point to.
 */
export type TypedFormData = {
  types: EntityTypeDto[];
  vocabularies: VocabularyDto[];
  links: LinkTargets;
};
