import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { FinanceKpis } from "./finance-kpis";
import { MonthlyChartCard } from "./monthly-chart-card";
import { RevenueTypeCard } from "./revenue-type-card";
import { VatCard } from "./vat-card";

export type FinancePeriodSectionProps = { overview: FinanceOverviewDto; numbers: NumberFormat };

/** Everything the picked period decides: invoiced and received, per month, per type and VAT. */
export function FinancePeriodSection({ overview, numbers }: FinancePeriodSectionProps) {
  return (
    <div data-slot="finance-period" className="grid gap-6">
      <FinanceKpis overview={overview} numbers={numbers} part="period" />
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyChartCard overview={overview} numbers={numbers} />
        <RevenueTypeCard overview={overview} numbers={numbers} />
      </div>
      <VatCard overview={overview} numbers={numbers} />
    </div>
  );
}
