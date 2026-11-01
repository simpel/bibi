import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { ForwardBookedChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { forwardRows } from "../lib/chart-data";
import { monthLabelOf } from "../lib/month-label";
import { FinanceSection } from "./finance-section";

export type ForwardBookedCardProps = {
  overview: Pick<FinanceOverviewDto, "currency" | "forwardBooked">;
  numbers: NumberFormat;
};

/** Accepted quotes not yet invoiced, by event month. */
export function ForwardBookedCard({ overview, numbers }: ForwardBookedCardProps) {
  const t = useTranslations("finance");
  const { forwardBooked, currency } = overview;
  return (
    <FinanceSection title={t("charts.forward.title")} data={forwardBooked}>
      <ForwardBookedChart
        label={t("charts.forward.title")}
        categoryLabel={t("charts.month")}
        valueLabel={t("charts.forward.value")}
        months={forwardRows({
          forwardBooked: forwardBooked ?? [],
          numbers,
          currency,
          monthLabel: monthLabelOf({ label: (values) => t("monthLabel", values) }),
        })}
      />
    </FinanceSection>
  );
}
