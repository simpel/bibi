import type { BookingSeriesDto } from "@okazi/core";
import { getFormatter, getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { FactList } from "@/components/typed-fields/fact-list";
import type { SeriesFormData } from "./series-form-data";

export type SeriesFactsProps = { series: BookingSeriesDto; data: SeriesFormData };

/** Description list of a series: type, customer, rule, first start, length, items and setup. */
export async function SeriesFacts({ series, data }: SeriesFactsProps) {
  const t = await getTranslations("bookingSeries.fields");
  const format = await getFormatter();
  const { template } = series;
  const type = data.types.find(({ id }) => id === series.entityTypeId);
  const rooms = template.itemIds.map((id) => nameOf({ options: data.rooms, id })).join(", ");
  const facts = [
    { label: t("type"), value: type?.name ?? "–" },
    { label: t("customer"), value: nameOf({ options: data.customers, id: series.customerId }) },
    { label: t("rule"), value: series.rule },
    {
      label: t("startsAt"),
      value: format.dateTime(series.startsAt, { dateStyle: "medium", timeStyle: "short" }),
    },
    { label: t("durationMinutes"), value: String(series.durationMinutes) },
    { label: t("timeZone"), value: series.timeZone },
    { label: t("room"), value: rooms || "–" },
    { label: t("setup"), value: nameOf({ options: data.setups, id: template.setupId }) },
    {
      label: t("estimatedHeadcount"),
      value: template.estimatedHeadcount === null ? "–" : String(template.estimatedHeadcount),
    },
  ];
  return <FactList facts={facts} />;
}
