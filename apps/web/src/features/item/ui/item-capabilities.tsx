import type { ItemDto } from "@bibi/core";
import {
  BookableDisplay,
  BundleDisplay,
  CustomisationsDisplay,
  LayoutsDisplay,
  PricedDisplay,
} from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getNumberFormat } from "@/server/number-format";
import { customisationGroupLines } from "./customisation-group-lines";
import type { ItemFormData } from "./item-form-data";

export type ItemCapabilitiesProps = { item: ItemDto; data: ItemFormData };

/** The capability values of an item (price, length, layouts, parts, customisations), shown with `@bibi/ui` displays. */
export async function ItemCapabilities({ item, data }: ItemCapabilitiesProps) {
  const t = await getTranslations("item");
  const { money } = await getNumberFormat();
  const price =
    item.priceMinor === null || item.priceUnit === null
      ? null
      : t("priceValue", {
          amount: money({ minor: item.priceMinor }),
          unit: t(`priceUnits.${item.priceUnit}`),
        });
  const duration =
    item.defaultDurationMinutes === null
      ? null
      : t("durationValue", { minutes: item.defaultDurationMinutes });
  const limits =
    item.maxPeople === null ? [] : [{ label: t("maxPeople"), value: String(item.maxPeople) }];
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
      <LayoutsDisplay title={t("sections.layouts")} rows={limits} />
      <BundleDisplay title={t("sections.parts")} parts={parts} />
      <CustomisationsDisplay title={t("sections.customisations")} groups={groups} />
    </div>
  );
}
