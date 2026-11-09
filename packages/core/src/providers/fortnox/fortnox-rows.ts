import { scaleParts } from "../../accounting/sie4/sale";
import { vatParts } from "../../features/finance/account-map";
import type { InvoiceSnapshot, InvoiceSnapshotDeduction, InvoiceSnapshotLine } from "../types";
import type { FortnoxInvoiceRow } from "./fortnox-types";

const units = ({ minor }: { minor: number }) => minor / 100;

/** A line with one VAT rate keeps its quantity, price and discount; a bundle splits per rate. */
function lineRows({ line }: { line: InvoiceSnapshotLine }): FortnoxInvoiceRow[] {
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
  }));
}

type DeductionInput = { deduction: InvoiceSnapshotDeduction; account: number };

/**
 * A deducted deposit as negative rows on the customer advances account (ADR 0093): one per VAT
 * rate of its split, priced excl. VAT, so the invoice's VAT is net of what was reported when the
 * deposit was paid. A deposit without a split is one row without VAT.
 */
function deductionRows({ deduction, account }: DeductionInput): FortnoxInvoiceRow[] {
  const { description } = deduction;
  const parts = vatParts({ vatRows: deduction.vatRows });
  const row = { quantity: 1, discountPercent: 0, accountNumber: account };
  if (parts.length === 0) {
    return [
      { ...row, description, price: -units({ minor: deduction.amountMinor }), vatPercent: 0 },
    ];
  }
  return scaleParts({ parts, amountMinor: deduction.amountMinor }).map((part) => ({
    ...row,
    description: parts.length > 1 ? `${description} (${part.vatRatePercent} %)` : description,
    price: -units({ minor: part.exclVatMinor }),
    vatPercent: part.vatRatePercent,
  }));
}

/**
 * The invoice as Fortnox rows (ADR 0090, 0093): the frozen lines that count, then each deducted
 * deposit on the customer advances account, so revenue stays the lines'.
 */
export function fortnoxRows({ invoice }: { invoice: InvoiceSnapshot }): FortnoxInvoiceRow[] {
  const sold = invoice.lines.flatMap((line) => lineRows({ line }));
  const account = Number(invoice.advancesAccount);
  const paid = invoice.deductions.flatMap((deduction) => deductionRows({ deduction, account }));
  return [...sold, ...paid];
}
