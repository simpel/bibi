import { billingOperations } from "./features/billing/operations";
import {
  creditNoteOperations,
  getCreditNote,
  listCreditNotes,
} from "./features/credit-note/operations";
import { depositOperations } from "./features/deposit/operations";
import {
  financeOperations,
  financeOverview,
  listAccountMappings,
  setAccountMapping,
} from "./features/finance/operations";
import { applyIntegrationSignal } from "./features/integration/apply-signal-operation";
import {
  completeIntegrationConnect,
  connectIntegration,
  disconnectIntegration,
  integrationOperations,
  listIntegrationAccounts,
  listIntegrations,
  refreshExpiringIntegrations,
  syncIntegrationAccounts,
} from "./features/integration/operations";
import { applyInvoiceSignal } from "./features/invoice/apply-signal-operation";
import {
  createInvoice,
  creditInvoice,
  getInvoice,
  invoiceOperations,
  listInvoices,
  sendInvoice,
  syncInvoice,
  voidInvoice,
} from "./features/invoice/operations";
import { retryCredits } from "./features/invoice/retry-credits";
import { paymentOperations } from "./features/payment/operations";
import { retryRefunds } from "./features/payment/retry-refunds-operation";
import {
  startPaymentAttempt,
  startPublicAttempt,
} from "./features/payment/start-attempt-operation";
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
  ...creditNoteOperations,
  ...financeOperations,
  ...integrationOperations,
];

// The invoice and financials operations reach the package index through here (its size limit).
// `systemOnly` operations (provider signals, worker jobs, the public pay page) are exported but
// never registered: `createCoreOperations` refuses them.
export {
  applyIntegrationSignal,
  applyInvoiceSignal,
  completeIntegrationConnect,
  connectIntegration,
  createInvoice,
  creditInvoice,
  disconnectIntegration,
  financeOverview,
  getCreditNote,
  getInvoice,
  invoiceOperations,
  listAccountMappings,
  listCreditNotes,
  listIntegrationAccounts,
  listIntegrations,
  listInvoices,
  refreshExpiringIntegrations,
  retryCredits,
  retryRefunds,
  sendInvoice,
  setAccountMapping,
  startPaymentAttempt,
  startPublicAttempt,
  syncIntegrationAccounts,
  syncInvoice,
  voidInvoice,
};
