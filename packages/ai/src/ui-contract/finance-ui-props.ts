import type { BillingUiProps } from "./billing-entries";
import type {
  AccountingExportPreviewWire,
  AccountingExportWire,
  FinanceOverviewWire,
} from "./finance-entries";

/**
 * Component props of the financials and SIE export cards and of Bibi's own subscription
 * (part of `ToolUiProps`).
 */
export type FinanceUiProps = BillingUiProps & {
  "finance-overview": { overview: FinanceOverviewWire };
  "accounting-export-preview": { preview: AccountingExportPreviewWire };
  "accounting-export-card": { accountingExport: AccountingExportWire };
  "accounting-export-file": { file: { filename: string; size: number } };
};
