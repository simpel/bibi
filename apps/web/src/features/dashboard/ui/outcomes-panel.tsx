import type { DashboardSummary, NumberFormat } from "@bibi/core/schemas";
import { StackedBarChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { monthLabelOf } from "@/features/finance/lib/month-label";
import { FinanceSection } from "@/features/finance/ui/finance-section";
import { wholeMoney } from "@/lib/number/whole-money";
import { outcomeRows, winRate } from "../lib/outcome-rows";

export type OutcomesPanelProps = {
  outcomes: NonNullable<DashboardSummary["outcomes"]>;
  currency: string;
  numbers: NumberFormat;
};

/** Won against lost tickets per month, the win rate and the numbers beside the chart. */
export function OutcomesPanel({ outcomes, currency, numbers }: OutcomesPanelProps) {
  const t = useTranslations("dashboard.outcomes");
  const finance = useTranslations("finance");
  const share = winRate({ outcomes });
  return (
    <FinanceSection title={t("title")} data={share ? outcomes : []} emptyText={t("empty")}>
      {share ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("winRate", {
            rate: `${numbers.number({ value: Math.round(share.rate * 100) })} %`,
            won: share.won,
            total: share.total,
          })}
        </p>
      ) : null}
      <StackedBarChart
        label={t("title")}
        categoryLabel={t("month")}
        series={[{ label: t("won") }, { label: t("lost") }]}
        rows={outcomeRows({
          outcomes,
          numbers,
          currency,
          money: wholeMoney,
          monthLabel: monthLabelOf({ label: (values) => finance("monthLabel", values) }),
          text: (values) => t("text", values),
        })}
      />
    </FinanceSection>
  );
}
