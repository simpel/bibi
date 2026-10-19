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
  /** The caller may not view venues: show them as hidden and disable the picker. */
  venuesHidden: boolean;
  parts: { id: string; name: string }[];
};
