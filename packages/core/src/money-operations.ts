import { billingOperations } from "./features/billing/operations";
import { depositOperations } from "./features/deposit/operations";
import {
  createAccountingExport,
  downloadAccountingExport,
  financeOperations,
  financeOverview,
  getAccountingExport,
  getAccountingSettings,
  listAccountingExports,
  previewAccountingExport,
  updateAccountingSettings,
} from "./features/finance/operations";
import {
  completeIntegrationConnect,
  connectIntegration,
  disconnectIntegration,
  integrationOperations,
  listIntegrations,
  refreshExpiringIntegrations,
} from "./features/integration/operations";
import {
  createInvoice,
  getInvoice,
  invoiceOperations,
  listInvoices,
  sendInvoice,
  syncInvoice,
  voidInvoice,
} from "./features/invoice/operations";
import { paymentOperations } from "./features/payment/operations";
import { paymentAccountOperations } from "./features/payment-account/operations";

/**
 * Payments, the receivables they settle (ADR 0057), the payout account and the financials with
 * their accounting export (ADR 0077), and the connections to accounting systems (ADR 0087).
 */
export const moneyOperations = [
  ...billingOperations,
  ...paymentAccountOperations,
  ...paymentOperations,
  ...depositOperations,
  ...invoiceOperations,
  ...financeOperations,
  ...integrationOperations,
];

// The invoice and financials operations reach the package index through here (its size limit).
export {
  completeIntegrationConnect,
  connectIntegration,
  createAccountingExport,
  createInvoice,
  disconnectIntegration,
  downloadAccountingExport,
  financeOverview,
  getAccountingExport,
  getAccountingSettings,
  getInvoice,
  invoiceOperations,
  listAccountingExports,
  listIntegrations,
  listInvoices,
  previewAccountingExport,
  refreshExpiringIntegrations,
  sendInvoice,
  syncInvoice,
  updateAccountingSettings,
  voidInvoice,
};
