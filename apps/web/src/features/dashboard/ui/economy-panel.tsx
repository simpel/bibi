import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { FinanceKpis } from "@/features/finance/ui/finance-kpis";
import { MonthlyChartCard } from "@/features/finance/ui/monthly-chart-card";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type EconomyPanelProps = { overview: FinanceOverviewDto; numbers: NumberFormat };

/** The money figures and invoiced against received per month, from `finance.overview` (ADR 0079). */
export function EconomyPanel({ overview, numbers }: EconomyPanelProps) {
  const t = useTranslations("dashboard.economy");
  const finance = useTranslations("finance");
  return (
    <section aria-label={t("title")} className="grid gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base">{t("title")}</h2>
        <Link href={ROUTES.financials} className="text-sm hover:underline">
          {finance("openFinancials")}
        </Link>
      </div>
      <FinanceKpis overview={overview} numbers={numbers} />
      <MonthlyChartCard overview={overview} numbers={numbers} />
    </section>
  );
}
