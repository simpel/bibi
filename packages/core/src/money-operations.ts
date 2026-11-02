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
import type {
  FortnoxCompany,
  FortnoxGateway,
  FortnoxRefresh,
  FortnoxTokens,
} from "./features/integration/fortnox/gateway";
import {
  getFortnoxGateway,
  setFortnoxGateway,
} from "./features/integration/fortnox/gateway-registry";
import type {
  FortnoxInvoiceInput,
  FortnoxInvoicingGateway,
  FortnoxPayment,
} from "./features/integration/fortnox/invoicing-gateway";
import {
  getFortnoxInvoicingGateway,
  setFortnoxInvoicingGateway,
} from "./features/integration/fortnox/invoicing-registry";
import {
  type FortnoxEventOutcome,
  type FortnoxTopicEvent,
  FortnoxTopicEventSchema,
  handleFortnoxEvent,
} from "./features/integration/fortnox/topics/events";
import {
  FORTNOX_REPLAY_MS,
  fortnoxStreamSecret,
  sweepFortnoxInvoices,
} from "./features/integration/fortnox/topics/sweep";
import {
  type FortnoxTenantToken,
  fortnoxTenantTokens,
  loadFortnoxOffsets,
  rememberFortnoxTenant,
  saveFortnoxOffset,
} from "./features/integration/fortnox/topics/tenants";
import {
  completeIntegrationConnect,
  connectIntegration,
  disconnectIntegration,
  getFortnoxAccessToken,
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
  ...paymentAccountOperations,
  ...paymentOperations,
  ...depositOperations,
  ...invoiceOperations,
  ...financeOperations,
  ...integrationOperations,
];

// The integration feature reaches the package index through here (its size limit).
export type {
  FortnoxCompany,
  FortnoxEventOutcome,
  FortnoxGateway,
  FortnoxInvoiceInput,
  FortnoxInvoicingGateway,
  FortnoxPayment,
  FortnoxRefresh,
  FortnoxTenantToken,
  FortnoxTokens,
  FortnoxTopicEvent,
};
// The invoice and financials operations reach the package index through here (its size limit).
export {
  completeIntegrationConnect,
  connectIntegration,
  createAccountingExport,
  createInvoice,
  disconnectIntegration,
  downloadAccountingExport,
  FORTNOX_REPLAY_MS,
  FortnoxTopicEventSchema,
  financeOverview,
  fortnoxStreamSecret,
  fortnoxTenantTokens,
  getAccountingExport,
  getAccountingSettings,
  getFortnoxAccessToken,
  getFortnoxGateway,
  getFortnoxInvoicingGateway,
  getInvoice,
  handleFortnoxEvent,
  invoiceOperations,
  listAccountingExports,
  listIntegrations,
  listInvoices,
  loadFortnoxOffsets,
  previewAccountingExport,
  refreshExpiringIntegrations,
  rememberFortnoxTenant,
  saveFortnoxOffset,
  sendInvoice,
  setFortnoxGateway,
  setFortnoxInvoicingGateway,
  sweepFortnoxInvoices,
  syncInvoice,
  updateAccountingSettings,
  voidInvoice,
};
