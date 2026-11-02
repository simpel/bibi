import type { EntityTypeDto, ItemCapability, VocabularyDto } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import type { LinkTargets } from "@/components/typed-fields/typed-form-data";
import type { CustomisableItem } from "../../line/ui/program-form-data";

/** An active item as the line dialog searches and fills it (prepared on the server). */
export type CatalogItem = {
  id: string;
  name: string;
  typeName: string;
  /** Its type's capabilities (ADR 0059): which fields the line dialog shows. */
  capabilities: ItemCapability[];
  /** Its venue's zone, else the organization's (ADR 0064): the zone its line times are in. */
  timeZone: string;
  /** The list price, the placeholder of the unit price. */
  priceMinor: number | null;
  defaultDurationMinutes: number | null;
  setups: { id: string; name: string; capacity: number }[];
  groups: CustomisableItem["groups"];
};

/** What step 4 and the line dialog read besides the draft (ADR 0081). */
export type IntakeCatalog = {
  /** Every active catalog item (one page); empty without `item:read`. */
  items: CatalogItem[];
  itemsHidden: boolean;
  /** Line types with their own fields. */
  lineTypes: EntityTypeDto[];
  /** Active ticket types with their own fields. */
  ticketTypes: EntityTypeDto[];
  vocabularies: VocabularyDto[];
  links: LinkTargets;
  /** The requirement type needs are counted with; null hides needs. */
  needTypeId: string | null;
  /** Every list value a need can count, "List: Value". */
  needValues: NamedOption[];
  /** Members who can be assigned (`id` = user id). */
  members: NamedOption[];
  /** The creating member, the default assignee. */
  userId: string | null;
};

export const hasCapability = ({
  item,
  capability,
}: {
  item: CatalogItem | undefined;
  capability: ItemCapability;
}) => item?.capabilities.includes(capability) ?? false;
