import type { EntityTypeDto, SetupDto, VocabularyDto } from "@okazi/core";
import type { LinkTargets } from "@/components/typed-fields/typed-form-data";

/**
 * Configuration the item form reads: item types, lists, setups and venues of the organization,
 * plus the items that can be picked as parts.
 */
export type ItemFormData = {
  types: EntityTypeDto[];
  vocabularies: VocabularyDto[];
  links: LinkTargets;
  setups: SetupDto[];
  venues: { id: string; name: string }[];
  parts: { id: string; name: string }[];
};
