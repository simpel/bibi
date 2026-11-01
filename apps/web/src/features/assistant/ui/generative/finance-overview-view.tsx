"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { FinanceStatCards } from "@/features/finance/ui/finance-stat-cards";
import { MonthlyChartCard } from "@/features/finance/ui/monthly-chart-card";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type FinanceOverviewViewProps = GenerativeProps<"finance-overview">;

/** The stat cards and invoiced against received per month; the Financials tab has the rest. */
export function FinanceOverviewView({ overview }: FinanceOverviewViewProps) {
  const t = useTranslations("finance");
  const numbers = useNumberFormat();
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="finance-overview" className="grid gap-3 p-4 shadow-none">
      <FinanceStatCards overview={overview} dates={dates} numbers={numbers} />
      <MonthlyChartCard overview={overview} numbers={numbers} />
      <Link href={ROUTES.financials} className="text-sm font-medium hover:underline">
        {t("openFinancials")}
      </Link>
    </Card>
  );
}
