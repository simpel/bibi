import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { ForwardBookedChart, RevenueByTypeChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { forwardRows, typeRows } from "../lib/chart-data";
import { monthLabelOf } from "../lib/month-label";
import { AgingCard } from "./aging-card";
import { FinanceSection } from "./finance-section";
import { MonthlyChartCard } from "./monthly-chart-card";

export type FinanceChartGridProps = { overview: FinanceOverviewDto; numbers: NumberFormat };

/** The four charts in a 2×2 grid (one column on a phone). */
export function FinanceChartGrid({ overview, numbers }: FinanceChartGridProps) {
  const t = useTranslations("finance");
  const { aging, forwardBooked, revenueByType, currency } = overview;
  const format = { numbers, currency };
  return (
    <div data-slot="finance-chart-grid" className="grid gap-4 md:grid-cols-2">
      <MonthlyChartCard overview={overview} numbers={numbers} />
      <AgingCard aging={aging} numbers={numbers} currency={currency} />
      <FinanceSection title={t("charts.forward.title")} data={forwardBooked}>
        <ForwardBookedChart
          label={t("charts.forward.title")}
          categoryLabel={t("charts.month")}
          valueLabel={t("charts.forward.value")}
          months={forwardRows({
            forwardBooked: forwardBooked ?? [],
            ...format,
            monthLabel: monthLabelOf({ label: (values) => t("monthLabel", values) }),
          })}
        />
      </FinanceSection>
      <FinanceSection title={t("charts.revenue.title")} data={revenueByType}>
        <RevenueByTypeChart
          label={t("charts.revenue.title")}
          categoryLabel={t("charts.revenue.type")}
          amountLabel={t("charts.revenue.invoiced")}
          types={typeRows({
            revenueByType: revenueByType ?? [],
            withoutType: t("charts.revenue.withoutType"),
            ...format,
          })}
        />
      </FinanceSection>
    </div>
  );
}
