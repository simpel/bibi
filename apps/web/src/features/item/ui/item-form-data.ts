import type { EntityTypeDto, SetupDto, VocabularyDto } from "@okazi/core";

/** Configuration the item form reads: item types, lists, setups and venues of the organization. */
export type ItemFormData = {
  types: EntityTypeDto[];
  vocabularies: VocabularyDto[];
  setups: SetupDto[];
  venues: { id: string; name: string }[];
};
