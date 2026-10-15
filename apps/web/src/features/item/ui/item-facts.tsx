import type { EntityTypeDto, ItemDto } from "@okazi/core";
import { getTranslations } from "next-intl/server";
import { FactList } from "@/components/typed-fields/fact-list";
import { itemFacts } from "./item-facts-list";
import type { ItemFormData } from "./item-form-data";

export type ItemFactsProps = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  locale: string;
};

/** Description list of an item: core facts, the type's own fields and the behaviour values. */
export async function ItemFacts({ item, type, data, locale }: ItemFactsProps) {
  const t = await getTranslations("item");
  const common = await getTranslations("common");
  const yesNo = { yes: common("yes"), no: common("no") };
  const facts = itemFacts({ item, type, data, locale, t, yesNo });
  return <FactList facts={facts} />;
}
