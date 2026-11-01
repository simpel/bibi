"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { FinanceKpis } from "@/features/finance/ui/finance-kpis";
import { MonthlyChartCard } from "@/features/finance/ui/monthly-chart-card";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type FinanceOverviewViewProps = GenerativeProps<"finance-overview">;

/** The headline figures and invoiced against received per month; the page has the rest. */
export function FinanceOverviewView({ overview }: FinanceOverviewViewProps) {
  const t = useTranslations("finance");
  const numbers = useNumberFormat();
  return (
    <Card data-slot="finance-overview" className="grid gap-3 p-4 shadow-none">
      <FinanceKpis overview={overview} numbers={numbers} />
      <MonthlyChartCard overview={overview} numbers={numbers} />
      <Link href={ROUTES.financials} className="text-sm font-medium hover:underline">
        {t("openFinancials")}
      </Link>
    </Card>
  );
}
