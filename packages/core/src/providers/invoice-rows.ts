import { scaleParts, vatParts } from "../features/finance/vat-parts";
import type { InvoiceSnapshot, InvoiceSnapshotDeduction, InvoiceSnapshotLine } from "./types";

/** One invoice row as accounting providers take it (ADR 0090): amounts in units, excl. VAT. */
export type ProviderInvoiceRow = {
  description: string;
  quantity: number;
  price: number;
  /** 0–100. */
  discountPercent: number;
  vatPercent: number;
  /** Revenue account, or the customer advances account for a deducted deposit. */
  accountNumber: number;
  /**
   * On the customer advances account (ADR 0093, 0106): a prepayment invoice's rows and a deducted
   * deposit. Visma codes a row by its article, so these need an article coded to that account.
   */
  advance: boolean;
};

const units = ({ minor }: { minor: number }) => minor / 100;

/** A line with one VAT rate keeps its quantity, price and discount; a bundle splits per rate. */
function lineRows({ line }: { line: InvoiceSnapshotLine }): ProviderInvoiceRow[] {
  const account = Number(line.revenueAccount);
  if (line.vatRows.length <= 1) {
    return [
      {
        description: line.name,
        quantity: line.quantity,
        price: units({ minor: line.unitPriceMinor }),
        discountPercent: line.discountPercent,
        vatPercent: line.vatRatePercent,
        accountNumber: account,
        advance: false,
      },
    ];
  }
  return line.vatRows.map((row) => ({
    description: `${line.name} (${row.vatRatePercent} %)`,
    quantity: 1,
    price: units({ minor: row.totalExclVatMinor }),
    discountPercent: 0,
    vatPercent: row.vatRatePercent,
    accountNumber: account,
    advance: false,
  }));
}

type DeductionInput = { deduction: InvoiceSnapshotDeduction; account: number };

/**
 * A deducted deposit as rows of quantity −1 on the customer advances account (ADR 0093, 0106):
 * one per VAT rate of its split, with a positive price excl. VAT, so the invoice's VAT is net of
 * what was reported when the deposit was paid and the rows pass the e-invoice checks (Peppol
 * refuses negative prices). A deposit without a split is one row without VAT.
 */
function deductionRows({ deduction, account }: DeductionInput): ProviderInvoiceRow[] {
  const { description } = deduction;
  const parts = vatParts({ vatRows: deduction.vatRows });
  const row = { quantity: -1, discountPercent: 0, accountNumber: account, advance: true };
  if (parts.length === 0) {
    return [{ ...row, description, price: units({ minor: deduction.amountMinor }), vatPercent: 0 }];
  }
  return scaleParts({ parts, amountMinor: deduction.amountMinor }).map((part) => ({
    ...row,
    description: parts.length > 1 ? `${description} (${part.vatRatePercent} %)` : description,
    price: units({ minor: part.exclVatMinor }),
    vatPercent: part.vatRatePercent,
  }));
}

/**
 * The invoice as provider rows (ADR 0090, 0093): the frozen lines that count, then each deducted
 * deposit on the customer advances account, so revenue stays the lines'. A prepayment invoice's
 * lines are on the advances account too, so they are advance rows. Fortnox and Visma.
 */
export function invoiceRows({ invoice }: { invoice: InvoiceSnapshot }): ProviderInvoiceRow[] {
  const account = Number(invoice.advancesAccount);
  const sold = invoice.lines
    .flatMap((line) => lineRows({ line }))
    .map((row) => ({ ...row, advance: row.accountNumber === account }));
  const paid = invoice.deductions.flatMap((deduction) => deductionRows({ deduction, account }));
  return [...sold, ...paid];
}
