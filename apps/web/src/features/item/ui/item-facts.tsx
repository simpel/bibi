import type { EntityTypeDto, ItemDto } from "@okazi/core";
import { getTranslations } from "next-intl/server";
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
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {facts.map(({ label, value }) => (
        <div key={`${label}-${value}`}>
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
