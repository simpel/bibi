import type { BucketSize, DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { monthLabelOf } from "@/features/finance/lib/month-label";
import { bucketLabelOf } from "./bucket-label";
import type { StatTexts } from "./stat-trend";

export type UseStatTextsInput = {
  size: BucketSize;
  timeZone: string;
  dates: DateTimeFormat;
  numbers: NumberFormat;
  /** How the figure is written, e.g. as money. */
  value: StatTexts["value"];
};

/** The texts a stat card's line and trend need, in the UI language (ADR 0086). */
export function useStatTexts({
  size,
  timeZone,
  dates,
  numbers,
  value,
}: UseStatTextsInput): StatTexts {
  const t = useTranslations("dashboard.trend");
  const finance = useTranslations("finance");
  return {
    value,
    bucket: bucketLabelOf({
      ...{ size, timeZone, dates },
      weekOf: (values) => t("weekOf", values),
      monthLabel: monthLabelOf({ label: (values) => finance("monthLabel", values) }),
    }),
    percent: ({ value: change }) =>
      t("percent", {
        sign: change > 0 ? "+" : change < 0 ? "−" : "",
        value: numbers.number({ value: Math.abs(change) }),
      }),
    description: t("vsPrevious"),
  };
}
