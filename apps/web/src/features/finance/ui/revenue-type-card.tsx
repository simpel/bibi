import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { RevenueByTypeChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { typeRows } from "../lib/chart-data";
import { FinanceSection } from "./finance-section";

export type RevenueTypeCardProps = {
  overview: Pick<FinanceOverviewDto, "currency" | "revenueByType">;
  numbers: NumberFormat;
};

/** Invoiced excluding VAT per item type in the period. */
export function RevenueTypeCard({ overview, numbers }: RevenueTypeCardProps) {
  const t = useTranslations("finance");
  const { revenueByType, currency } = overview;
  return (
    <FinanceSection title={t("charts.revenue.title")} data={revenueByType}>
      <RevenueByTypeChart
        label={t("charts.revenue.title")}
        categoryLabel={t("charts.revenue.type")}
        amountLabel={t("charts.revenue.invoiced")}
        types={typeRows({
          revenueByType: revenueByType ?? [],
          withoutType: t("charts.revenue.withoutType"),
          numbers,
          currency,
        })}
      />
    </FinanceSection>
  );
}
