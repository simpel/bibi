import type { EntityTypeDto, ItemDto } from "@okazi/core";
import { nameOf } from "@/components/form/named-option";
import type { Fact } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import type { ItemFormData } from "./item-form-data";
import type { ItemTranslator } from "./item-translator";

export type ItemFactsInput = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  t: ItemTranslator;
  yesNo: { yes: string; no: string };
  /** Text for a record of a feature the caller may not view. */
  hidden: string;
};

/** Facts of an item's page: type, venue and the type's own fields (capabilities: `ItemCapabilities`). */
export function itemFacts({ item, type, data, t, yesNo, hidden }: ItemFactsInput): Fact[] {
  const venue =
    data.venuesHidden && item.venueId ? hidden : nameOf({ options: data.venues, id: item.venueId });
  const { vocabularies, links } = data;
  const own = ownFieldFacts({ type, stored: item.fields, vocabularies, links, yesNo });
  return [
    { label: t("fields.type"), value: type?.name ?? "–" },
    { label: t("fields.venue"), value: venue },
    ...own,
  ];
}
