import type { ItemDto } from "@okazi/core";
import {
  BookableDisplay,
  BundleDisplay,
  CustomisationsDisplay,
  PricedDisplay,
  SetupsDisplay,
} from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { customisationGroupLines } from "./customisation-group-lines";
import { formatKr } from "./format-price";
import type { ItemFormData } from "./item-form-data";

export type ItemCapabilitiesProps = { item: ItemDto; data: ItemFormData; locale: string };

/** The capability values of an item (price, length, setups, parts, customisations), shown with `@okazi/ui` displays. */
export async function ItemCapabilities({ item, data, locale }: ItemCapabilitiesProps) {
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
  const parts = item.parts.map(({ itemId, quantity, offsetMinutes, required }) =>
    t("partValue", {
      quantity,
      name: data.parts.find(({ id }) => id === itemId)?.name ?? "–",
      offset: offsetMinutes,
      required: String(required),
    }),
  );
  const groups = customisationGroupLines({
    groups: item.customisationGroups,
    format: (values) => t("customisationGroupValue", values),
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PricedDisplay title={t("sections.price")} price={price} />
      <BookableDisplay title={t("sections.bookable")} duration={duration} />
      <SetupsDisplay title={t("sections.setups")} setups={setups} />
      <BundleDisplay title={t("sections.parts")} parts={parts} />
      <CustomisationsDisplay title={t("sections.customisations")} groups={groups} />
    </div>
  );
}
