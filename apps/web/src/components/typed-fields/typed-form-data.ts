import type { EntityTypeDto, VocabularyDto } from "@okazi/core";

/** What a typed record's form needs (ADR 0021): the base's types and the lists choices use. */
export type TypedFormData = { types: EntityTypeDto[]; vocabularies: VocabularyDto[] };
