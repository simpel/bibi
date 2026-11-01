import type {
  AccountingExportDto,
  AccountingExportPreviewDto,
  DateTimeFormat,
  FinanceOverviewDto,
  NumberFormat,
  PlainDate,
} from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";
import { plainDayText } from "../lib/plain-day";
import { CustomerFilter } from "./customer-filter";
import { ExportHistory } from "./export-history";
import { FinanceChartGrid } from "./finance-chart-grid";
import { FinanceKpis } from "./finance-kpis";
import { FinanceTables } from "./finance-tables";
import { FinancialsHeader } from "./financials-header";
import { PeriodSwitcher } from "./period-switcher";

export type FinancialsViewProps = {
  overview: FinanceOverviewDto;
  preview: AccountingExportPreviewDto;
  exports: AccountingExportDto[];
  today: PlainDate;
  dates: DateTimeFormat;
  numbers: NumberFormat;
  canWrite: boolean;
  /** Customers the filter offers; empty without `customer:read`. */
  customers: { id: string; name: string }[];
  customerId: string | undefined;
};

type SpanInput = { preview: AccountingExportPreviewDto; timeZone: string; dates: DateTimeFormat };

/** The voucher date span of the pending export, written in the viewer's date format. */
function exportSpan({ preview, timeZone, dates }: SpanInput): string | null {
  const { firstDate, lastDate } = preview;
  if (!firstDate || !lastDate) return null;
  const day = ({ value }: { value: string }) => plainDayText({ day: value, timeZone, dates });
  return `${day({ value: firstDate })} – ${day({ value: lastDate })}`;
}

/** The page body once everything is loaded. */
export function FinancialsView(props: FinancialsViewProps) {
  const { overview, preview, exports, today, dates, numbers, canWrite } = props;
  const { customers, customerId } = props;
  const t = useTranslations("finance");
  const period = { from: overview.from, to: overview.to };
  const zone = { timeZone: overview.timeZone, dates };
  const span = exportSpan({ preview, ...zone });
  return (
    <div className="grid gap-6">
      <FinancialsHeader exportPreview={canWrite ? { preview, span } : null} />
      <div className="flex flex-wrap items-center gap-2">
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
      <p className="text-sm text-muted-foreground">
        {t("period.range", {
          from: plainDayText({ day: overview.from, ...zone }),
          to: plainDayText({ day: overview.to, ...zone }),
        })}
      </p>
      <FinanceKpis overview={overview} numbers={numbers} />
      <FinanceChartGrid overview={overview} numbers={numbers} />
      <FinanceTables overview={overview} dates={dates} numbers={numbers} />
      <ExportHistory exports={exports} dates={dates} canDownload={canWrite} />
    </div>
  );
}
