import type {
  AccountingExportPreviewWire,
  AccountingExportWire,
  FinanceOverviewWire,
} from "./finance-entries";

/** Component props of the financials and SIE export cards (part of `ToolUiProps`). */
export type FinanceUiProps = {
  "finance-overview": { overview: FinanceOverviewWire };
  "accounting-export-preview": { preview: AccountingExportPreviewWire };
  "accounting-export-card": { accountingExport: AccountingExportWire };
  "accounting-export-file": { file: { filename: string; size: number } };
};
