import type {
  AccountingExportDto,
  DateTimeFormat,
  FinanceOverviewDto,
  NumberFormat,
} from "@bibi/core/schemas";
import { PageContainer, PageSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AgingCard } from "./aging-card";
import { ExportHistory } from "./export-history";
import { FinanceKpis } from "./finance-kpis";
import { ForwardBookedCard } from "./forward-booked-card";
import { OverdueCard } from "./overdue-card";

export type FinanceOpenSectionProps = {
  overview: FinanceOverviewDto;
  exports: AccountingExportDto[];
  dates: DateTimeFormat;
  numbers: NumberFormat;
  canDownload: boolean;
};

/**
 * What does not depend on the period, edge to edge on the card colour under its own heading:
 * open and overdue money today, what is booked ahead, and the SIE exports.
 */
export function FinanceOpenSection(props: FinanceOpenSectionProps) {
  const { overview, exports, dates, numbers, canDownload } = props;
  const t = useTranslations("finance.now");
  return (
    <PageSection aria-labelledby="finance-now" tone="card" divided>
      <PageContainer className="grid gap-6">
        <header className="grid gap-1">
          <h2 id="finance-now" className="text-2xl">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </header>
        <FinanceKpis overview={overview} numbers={numbers} part="open" />
        <div className="grid gap-4 md:grid-cols-2">
          <AgingCard aging={overview.aging} numbers={numbers} currency={overview.currency} />
          <ForwardBookedCard overview={overview} numbers={numbers} />
        </div>
        <OverdueCard overview={overview} dates={dates} numbers={numbers} />
        <ExportHistory exports={exports} dates={dates} canDownload={canDownload} />
      </PageContainer>
    </PageSection>
  );
}
