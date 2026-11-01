import type {
  AccountingExportDto,
  DateTimeFormat,
  FinanceOverviewDto,
  NumberFormat,
  PlainDate,
} from "@bibi/core/schemas";
import { PageContainer, PageSection } from "@bibi/ui";
import { ROUTES } from "@/lib/routes";
import { CustomerFilter } from "./customer-filter";
import { FinanceOpenSection } from "./finance-open-section";
import { FinancePeriodSection } from "./finance-period-section";
import { FinancialsHeader } from "./financials-header";
import { PeriodSwitcher } from "./period-switcher";

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

/** The page body once everything is loaded: the period's money on top, today's below. */
export function FinancialsView(props: FinancialsViewProps) {
  const { overview, exports, today, dates, numbers, canWrite } = props;
  const { customers, customerId } = props;
  const period = { from: overview.from, to: overview.to };
  return (
    <>
      <PageSection>
        <PageContainer className="grid gap-6 pb-10 sm:pb-12">
          <FinancialsHeader exportPeriod={canWrite ? period : null} today={today} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PeriodSwitcher
              period={period}
              today={today}
              base={ROUTES.financials}
              customerId={customerId}
            />
            {customers.length > 0 ? (
              <CustomerFilter period={period} customers={customers} customerId={customerId} />
            ) : null}
          </div>
          <FinancePeriodSection overview={overview} numbers={numbers} />
        </PageContainer>
      </PageSection>
      <FinanceOpenSection
        overview={overview}
        exports={exports}
        dates={dates}
        numbers={numbers}
        canDownload={canWrite}
      />
    </>
  );
}
