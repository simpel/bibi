import { AccountingExportCardView } from "./accounting-export-card-view";
import { AccountingExportFileView } from "./accounting-export-file-view";
import { AccountingExportPreviewView } from "./accounting-export-preview-view";
import { BillingCardView } from "./billing-card-view";
import { DepositCardView } from "./deposit-card-view";
import { DepositTableView } from "./deposit-table-view";
import { FinanceOverviewView } from "./finance-overview-view";
import { IntegrationCardView } from "./integration-card-view";
import { InvoiceCardView } from "./invoice-card-view";
import { InvoiceTableView } from "./invoice-table-view";
import { OrderBalanceCardView } from "./order-balance-card-view";
import { PaymentAccountCardView } from "./payment-account-card-view";
import { PaymentCardView } from "./payment-card-view";
import { PaymentTableView } from "./payment-table-view";
import { SettingCardsView } from "./setting-cards-view";

/**
 * Payments, receivables, the derived balance (ADR 0057) and the editable setting cards, part of
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
  "setting-cards": SettingCardsView,
} as const;
