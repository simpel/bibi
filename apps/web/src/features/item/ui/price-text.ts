import type { ItemDto, NumberFormat } from "@bibi/core/schemas";
import type { useTranslations } from "next-intl";

export type PriceTextInput = {
  item: Pick<ItemDto, "priceMinor" | "priceUnit">;
  money: NumberFormat["money"];
  /** The `item` messages translator. */
  t: ReturnType<typeof useTranslations<"item">>;
};

/** "4 500,00 kr per hour", or "–" when the item has no price. */
export function priceText({ item, money, t }: PriceTextInput): string {
  if (item.priceMinor === null || item.priceUnit === null) return "–";
  const amount = money({ minor: item.priceMinor });
  return t("priceValue", { amount, unit: t(`priceUnits.${item.priceUnit}`) });
}
