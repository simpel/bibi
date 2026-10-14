import type { EntityTypeDto, ItemDto } from "@okazi/core";
import { displayValue } from "./field-display";
import { formatKr } from "./format-price";
import type { ItemFormData } from "./item-form-data";
import type { ItemTranslator } from "./item-translator";

export type Fact = { label: string; value: string };

export type ItemFactsInput = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  locale: string;
  t: ItemTranslator;
  yesNo: { yes: string; no: string };
};

/** Behaviour facts: price, default length and one capacity per setup. */
function behaviourFacts({ item, data, locale, t }: ItemFactsInput): Fact[] {
  const facts: Fact[] = [];
  if (item.priceMinor !== null && item.priceUnit !== null) {
    const amount = formatKr({ minor: item.priceMinor, locale });
    const unit = t(`priceUnits.${item.priceUnit}`);
    facts.push({ label: t("sections.price"), value: t("priceValue", { amount, unit }) });
  }
  if (item.defaultDurationMinutes !== null) {
    const minutes = item.defaultDurationMinutes;
    facts.push({
      label: t("fields.defaultDurationMinutes"),
      value: t("durationValue", { minutes }),
    });
  }
  for (const { setupId, capacity } of item.setups) {
    const name = data.setups.find(({ id }) => id === setupId)?.name ?? "–";
    facts.push({ label: t("sections.setups"), value: t("capacityValue", { name, capacity }) });
  }
  return facts;
}

/** Everything shown on an item's page: type, venue, the type's own fields and behaviours. */
export function itemFacts({ item, type, data, locale, t, yesNo }: ItemFactsInput): Fact[] {
  const venue = data.venues.find(({ id }) => id === item.venueId)?.name ?? "–";
  const own = (type?.fields ?? []).map((field) => ({
    label: field.name,
    value: displayValue({
      field,
      value: item.fields[field.key],
      vocabularies: data.vocabularies,
      yesNo,
    }),
  }));
  return [
    { label: t("fields.type"), value: type?.name ?? "–" },
    { label: t("fields.venue"), value: venue },
    ...own,
    ...behaviourFacts({ item, type, data, locale, t, yesNo }),
  ];
}
