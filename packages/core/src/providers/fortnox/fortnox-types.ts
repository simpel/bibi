import type { Result } from "../../errors/result";
import type { ProviderInvoiceRow } from "../invoice-rows";

/** One invoice row as Fortnox takes it (ADR 0090): amounts in currency units, excl. VAT. */
export type FortnoxInvoiceRow = ProviderInvoiceRow;

export type FortnoxCustomerInput = { name: string; email: string | null };

export type FortnoxInvoiceInput = {
  customerNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  currency: string;
  /** Bibi's own reference, shown as ours: `Order #<reference>, invoice #<number>`. */
  ourReference: string;
  /** The buyer's reference (Er referens, ADR 0105); null = none. */
  buyerReference: string | null;
  rows: FortnoxInvoiceRow[];
};

export type FortnoxPayment = {
  /** Fortnox's payment number, unique within the company. */
  number: string;
  amountMinor: number;
  paidAt: Date;
};

export type FortnoxAuthed<T> = T & { accessToken: string };

/** Fortnox's invoicing API for one organization's company (ADR 0090), called after the commit. */
export type FortnoxApi = {
  findOrCreateCustomer(input: FortnoxAuthed<FortnoxCustomerInput>): Promise<Result<string>>;
  /** Creates, books and (when the customer has an email) emails it; returns the document number. */
  raiseInvoice(
    input: FortnoxAuthed<FortnoxInvoiceInput & { email: boolean }>,
  ): Promise<Result<string>>;
  listPayments(input: FortnoxAuthed<{ documentNumber: string }>): Promise<Result<FortnoxPayment[]>>;
  /** Cancels an invoice Fortnox has not booked yet. */
  cancelInvoice(input: FortnoxAuthed<{ documentNumber: string }>): Promise<Result<true>>;
  /** Credits a booked invoice in full; returns the credit invoice's document number. */
  creditInvoice(input: FortnoxAuthed<{ documentNumber: string }>): Promise<Result<string>>;
};
