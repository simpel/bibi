import type { ItemDto } from "@bibi/core";
import type { useTranslations } from "next-intl";
import { formatKr } from "./format-price";

export type PriceTextInput = {
  item: Pick<ItemDto, "priceMinor" | "priceUnit">;
  locale: string;
  /** The `item` messages translator. */
  t: ReturnType<typeof useTranslations<"item">>;
};

/** "4 500 kr per hour", or "–" when the item has no price. */
export function priceText({ item, locale, t }: PriceTextInput): string {
  if (item.priceMinor === null || item.priceUnit === null) return "–";
  const amount = formatKr({ minor: item.priceMinor, locale });
  return t("priceValue", { amount, unit: t(`priceUnits.${item.priceUnit}`) });
}
