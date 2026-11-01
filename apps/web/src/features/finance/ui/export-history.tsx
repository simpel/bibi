import type { AccountingExportDto, DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { exportRows } from "../lib/export-rows";
import { ExportHistoryTable } from "./export-history-table";
import { FinanceSection } from "./finance-section";

export type ExportHistoryProps = {
  exports: AccountingExportDto[];
  dates: DateTimeFormat;
  canDownload: boolean;
};

/** The export history section of the Financials page. */
export function ExportHistory({ exports, dates, canDownload }: ExportHistoryProps) {
  const t = useTranslations("finance.export");
  return (
    <FinanceSection title={t("history")} data={exports} emptyText={t("historyEmpty")} flush>
      <ExportHistoryTable rows={exportRows({ exports, dates })} canDownload={canDownload} />
    </FinanceSection>
  );
}
