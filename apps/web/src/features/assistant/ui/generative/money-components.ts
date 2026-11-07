import { AccountingExportCardView } from "./accounting-export-card-view";
import { AccountingExportFileView } from "./accounting-export-file-view";
import { AccountingExportPreviewView } from "./accounting-export-preview-view";
import { AccountingSettingsCardView } from "./accounting-settings-card-view";
import { BillingCardView } from "./billing-card-view";
import { DepositCardView } from "./deposit-card-view";
import { DepositTableView } from "./deposit-table-view";
import { FinanceOverviewView } from "./finance-overview-view";
import { IntegrationCardView } from "./integration-card-view";
import { InvoiceCardView } from "./invoice-card-view";
import { InvoiceTableView } from "./invoice-table-view";
import { OrderBalanceCardView } from "./order-balance-card-view";
import { OrganizationSettingsCardView } from "./organization-settings-card-view";
import { PaymentAccountCardView } from "./payment-account-card-view";
import { PaymentCardView } from "./payment-card-view";
import { PaymentSettingsCardView } from "./payment-settings-card-view";
import { PaymentTableView } from "./payment-table-view";

/**
 * Payments, receivables, the derived balance (ADR 0057) and the editable settings cards, part of
 * `GENERATIVE_COMPONENTS`.
 */
export const MONEY_COMPONENTS = {
  "payment-account-card": PaymentAccountCardView,
  "integration-card": IntegrationCardView,
  "payment-table": PaymentTableView,
  "payment-card": PaymentCardView,
  "order-balance-card": OrderBalanceCardView,
  "deposit-table": DepositTableView,
  "deposit-card": DepositCardView,
  "invoice-table": InvoiceTableView,
  "invoice-card": InvoiceCardView,
  "finance-overview": FinanceOverviewView,
  "accounting-export-preview": AccountingExportPreviewView,
  "accounting-export-card": AccountingExportCardView,
  "accounting-export-file": AccountingExportFileView,
  "billing-card": BillingCardView,
  "organization-settings-card": OrganizationSettingsCardView,
  "payment-settings-card": PaymentSettingsCardView,
  "accounting-settings-card": AccountingSettingsCardView,
} as const;
