import type { BillingUiProps } from "./billing-entries";
import type { FinanceOverviewWire } from "./finance-entries";

/**
 * Component props of the financials card and of Bibi's own subscription
 * (part of `ToolUiProps`).
 */
export type FinanceUiProps = BillingUiProps & {
  "finance-overview": { overview: FinanceOverviewWire };
};
