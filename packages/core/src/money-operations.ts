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
  createInvoice,
  getInvoice,
  invoiceOperations,
  listInvoices,
  sendInvoice,
  voidInvoice,
} from "./features/invoice/operations";
import { paymentOperations } from "./features/payment/operations";
import { paymentAccountOperations } from "./features/payment-account/operations";

/**
 * Payments, the receivables they settle (ADR 0057), the payout account and the financials with
 * their accounting export (ADR 0077).
 */
export const moneyOperations = [
  ...paymentAccountOperations,
  ...paymentOperations,
  ...depositOperations,
  ...invoiceOperations,
  ...financeOperations,
];

// The invoice and financials operations reach the package index through here (its size limit).
export {
  createAccountingExport,
  createInvoice,
  downloadAccountingExport,
  financeOverview,
  getAccountingExport,
  getAccountingSettings,
  getInvoice,
  invoiceOperations,
  listAccountingExports,
  listInvoices,
  previewAccountingExport,
  sendInvoice,
  updateAccountingSettings,
  voidInvoice,
};
