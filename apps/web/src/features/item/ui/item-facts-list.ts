import type { EntityTypeDto, ItemDto } from "@okazi/core";
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
};

/** Facts of an item's page: type, venue and the type's own fields (behaviours: `ItemBehaviours`). */
export function itemFacts({ item, type, data, t, yesNo }: ItemFactsInput): Fact[] {
  const venue = data.venues.find(({ id }) => id === item.venueId)?.name ?? "–";
  const own = ownFieldFacts({ type, stored: item.fields, vocabularies: data.vocabularies, yesNo });
  return [
    { label: t("fields.type"), value: type?.name ?? "–" },
    { label: t("fields.venue"), value: venue },
    ...own,
  ];
}
