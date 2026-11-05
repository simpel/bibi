import type { NumberFormat } from "@bibi/core/schemas";
import { ForwardBookedChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { monthLabelOf } from "@/features/finance/lib/month-label";
import { FinanceSection } from "@/features/finance/ui/finance-section";

export type ForecastProjectionCardProps = {
  projectedMonthly: { month: string; valueMinor: number }[];
  currency: string;
  numbers: NumberFormat;
};

export function ForecastProjectionCard({
  projectedMonthly,
  currency,
  numbers,
}: ForecastProjectionCardProps) {
  const t = useTranslations("dashboard.forecast");
  const finance = useTranslations("finance");

  const rows = projectedMonthly.map(({ month, valueMinor }) => ({
    label: monthLabelOf({ label: (values) => finance("monthLabel", values) })({ month }),
    point: {
      value: valueMinor / 100,
      text: numbers.money({ minor: valueMinor, currency }),
    },
  }));

  return (
    <FinanceSection title={t("extrapolation")} data={projectedMonthly}>
      <ForwardBookedChart
        label={t("extrapolation")}
        categoryLabel={finance("charts.month")}
        valueLabel={t("expectedRevenue")}
        months={rows}
      />
    </FinanceSection>
  );
}
