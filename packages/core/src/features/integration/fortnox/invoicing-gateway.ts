import type { Result } from "../../../errors/result";

/** One invoice row as Fortnox takes it (ADR 0090): amounts in currency units, excl. VAT. */
export type FortnoxInvoiceRow = {
  description: string;
  quantity: number;
  price: number;
  discountPercent: number;
  vatPercent: number;
  /** Revenue account, or the customer advances account for a deducted deposit. */
  accountNumber: number;
};

export type FortnoxCustomerInput = { name: string; email: string | null };

export type FortnoxInvoiceInput = {
  customerNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  currency: string;
  /** Bibi's own reference, shown on the invoice: `Ticket #<reference>, invoice #<number>`. */
  yourOrderNumber: string;
  rows: FortnoxInvoiceRow[];
};

export type FortnoxPayment = {
  /** Fortnox's payment number, unique within the company. */
  number: string;
  amountMinor: number;
  paidAt: Date;
};

export type FortnoxAuthed<T> = T & { accessToken: string };

/**
 * Fortnox invoicing for one organization's company (ADR 0090), apart from the connection's
 * OAuth gateway (ADR 0087) so each has a small fake. Every call is made in an `external` step.
 */
export type FortnoxInvoicingGateway = {
  findOrCreateCustomer(input: FortnoxAuthed<FortnoxCustomerInput>): Promise<Result<string>>;
  /** Creates, books and (when the customer has an email) emails it; returns the document number. */
  raiseInvoice(
    input: FortnoxAuthed<FortnoxInvoiceInput & { email: boolean }>,
  ): Promise<Result<string>>;
  listPayments(input: FortnoxAuthed<{ documentNumber: string }>): Promise<Result<FortnoxPayment[]>>;
};
