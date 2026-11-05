import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { StackedBarChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { wholeMoney } from "@/lib/number/whole-money";
import { monthLabelOf } from "../lib/month-label";
import { outcomeRows, winRate } from "../lib/outcome-rows";
import { FinanceSection } from "./finance-section";

export type OutcomesCardProps = {
  overview: Pick<FinanceOverviewDto, "currency" | "outcomes">;
  numbers: NumberFormat;
};

/** Won against lost orders per month in the period, with the win rate (ADR 0080). */
export function OutcomesCard({ overview, numbers }: OutcomesCardProps) {
  const t = useTranslations("finance.outcomes");
  const finance = useTranslations("finance");
  const { outcomes, currency } = overview;
  const share = outcomes ? winRate({ outcomes }) : null;
  const data = outcomes === null ? null : share ? outcomes : [];
  return (
    <FinanceSection title={t("title")} data={data} emptyText={t("empty")}>
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
          outcomes: outcomes ?? [],
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
