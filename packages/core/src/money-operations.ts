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
  getAccountingSettings,
  updateAccountingSettings,
} from "./features/finance/operations";
import { applyIntegrationSignal } from "./features/integration/apply-signal-operation";
import {
  checkIntegrationSetup,
  completeIntegrationConnect,
  connectIntegration,
  disconnectIntegration,
  integrationOperations,
  listIntegrations,
  refreshExpiringIntegrations,
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
// SYSTEM-only operations (provider signals, the public pay page) are exported but not registered.
export {
  applyIntegrationSignal,
  applyInvoiceSignal,
  checkIntegrationSetup,
  completeIntegrationConnect,
  connectIntegration,
  createInvoice,
  creditInvoice,
  disconnectIntegration,
  financeOverview,
  getAccountingSettings,
  getCreditNote,
  getInvoice,
  invoiceOperations,
  listCreditNotes,
  listIntegrations,
  listInvoices,
  refreshExpiringIntegrations,
  retryCredits,
  retryRefunds,
  sendInvoice,
  startPaymentAttempt,
  startPublicAttempt,
  syncInvoice,
  updateAccountingSettings,
  voidInvoice,
};
