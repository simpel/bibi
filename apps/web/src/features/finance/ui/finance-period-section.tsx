import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { FinanceKpis } from "./finance-kpis";
import { MonthlyChartCard } from "./monthly-chart-card";
import { OutcomesCard } from "./outcomes-card";
import { RevenueTypeCard } from "./revenue-type-card";
import { VatCard } from "./vat-card";

export type FinancePeriodSectionProps = { overview: FinanceOverviewDto; numbers: NumberFormat };

/** Everything the picked period decides: invoiced and received, won and lost, per type and VAT. */
export function FinancePeriodSection({ overview, numbers }: FinancePeriodSectionProps) {
  return (
    <div data-slot="finance-period" className="grid gap-6">
      <FinanceKpis overview={overview} numbers={numbers} part="period" />
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyChartCard overview={overview} numbers={numbers} />
        <OutcomesCard overview={overview} numbers={numbers} />
        <RevenueTypeCard overview={overview} numbers={numbers} />
        <VatCard overview={overview} numbers={numbers} />
      </div>
    </div>
  );
}
