import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { MoneyByMonthChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { monthlyRows, monthsWithMoney } from "../lib/chart-data";
import { monthLabelOf } from "../lib/month-label";
import { FinanceSection } from "./finance-section";

export type MonthlyChartCardProps = {
  overview: Pick<FinanceOverviewDto, "currency" | "monthly">;
  numbers: NumberFormat;
};

/** Invoiced against received per month; the "no data" line when every month is zero. */
export function MonthlyChartCard({ overview, numbers }: MonthlyChartCardProps) {
  const t = useTranslations("finance");
  const { monthly, currency } = overview;
  return (
    <FinanceSection title={t("charts.monthly.title")} data={monthsWithMoney({ monthly })}>
      <MoneyByMonthChart
        label={t("charts.monthly.title")}
        categoryLabel={t("charts.month")}
        invoicedLabel={t("charts.monthly.invoiced")}
        receivedLabel={t("charts.monthly.received")}
        months={monthlyRows({
          monthly: monthly ?? [],
          numbers,
          currency,
          monthLabel: monthLabelOf({ label: (values) => t("monthLabel", values) }),
        })}
      />
    </FinanceSection>
  );
}
