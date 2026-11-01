import type {
  AccountingExportDto,
  DateTimeFormat,
  FinanceOverviewDto,
  NumberFormat,
  PlainDate,
} from "@bibi/core/schemas";
import { AgingCard } from "./aging-card";
import { ExportHistory } from "./export-history";
import { FinanceStatCards } from "./finance-stat-cards";
import { FinancialsToolbar } from "./financials-toolbar";
import { MonthlyChartCard } from "./monthly-chart-card";
import { OutcomesCard } from "./outcomes-card";
import { OverdueCard } from "./overdue-card";
import { RevenueTypeCard } from "./revenue-type-card";
import { VatCard } from "./vat-card";

export type FinancialsViewProps = {
  overview: FinanceOverviewDto;
  exports: AccountingExportDto[];
  today: PlainDate;
  dates: DateTimeFormat;
  numbers: NumberFormat;
  canWrite: boolean;
  /** Customers the filter offers; empty without `customer:read`. */
  customers: { id: string; name: string }[];
  customerId: string | undefined;
};

/**
 * The Financials tab once loaded (ADR 0086): the toolbar, the stat cards, then rows of charts and
 * full-width tables. A row holds cards of one kind; charts and tables never share one.
 */
export function FinancialsView(props: FinancialsViewProps) {
  const { overview, exports, today, dates, numbers, canWrite, customers, customerId } = props;
  const period = { from: overview.from, to: overview.to };
  return (
    <div data-slot="financials" className="grid gap-6">
      <FinancialsToolbar
        {...{ period, today, customers, customerId }}
        exportPeriod={canWrite ? period : null}
      />
      <FinanceStatCards overview={overview} dates={dates} numbers={numbers} />
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyChartCard overview={overview} numbers={numbers} />
        <OutcomesCard overview={overview} numbers={numbers} />
        <RevenueTypeCard overview={overview} numbers={numbers} />
        <AgingCard aging={overview.aging} numbers={numbers} currency={overview.currency} />
      </div>
      <VatCard overview={overview} numbers={numbers} />
      <OverdueCard overview={overview} dates={dates} numbers={numbers} />
      <ExportHistory exports={exports} dates={dates} canDownload={canWrite} />
    </div>
  );
}
