import type { ItemDto } from "@okazi/core";
import { BookableDisplay, ComposableDisplay, PricedDisplay, SetupsDisplay } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { formatKr } from "./format-price";
import type { ItemFormData } from "./item-form-data";

export type ItemBehavioursProps = { item: ItemDto; data: ItemFormData; locale: string };

/** The behaviour values of an item (price, length, setups, parts), shown with `@okazi/ui` displays. */
export async function ItemBehaviours({ item, data, locale }: ItemBehavioursProps) {
  const t = await getTranslations("item");
  const price =
    item.priceMinor === null || item.priceUnit === null
      ? null
      : t("priceValue", {
          amount: formatKr({ minor: item.priceMinor, locale }),
          unit: t(`priceUnits.${item.priceUnit}`),
        });
  const duration =
    item.defaultDurationMinutes === null
      ? null
      : t("durationValue", { minutes: item.defaultDurationMinutes });
  const setups = item.setups.map(({ setupId, capacity }) => ({
    name: data.setups.find(({ id }) => id === setupId)?.name ?? "–",
    capacity: String(capacity),
  }));
  const parts = item.components.map(({ itemId, quantity, offsetMinutes, required }) =>
    t("componentValue", {
      quantity,
      name: data.parts.find(({ id }) => id === itemId)?.name ?? "–",
      offset: offsetMinutes,
      required: String(required),
    }),
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PricedDisplay title={t("sections.price")} price={price} />
      <BookableDisplay title={t("sections.booking")} duration={duration} />
      <SetupsDisplay title={t("sections.setups")} setups={setups} />
      <ComposableDisplay title={t("sections.components")} parts={parts} />
    </div>
  );
}
