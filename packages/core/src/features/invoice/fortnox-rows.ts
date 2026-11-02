import type { InvoiceDeposit, OrderLine } from "@bibi/db";
import type { FortnoxInvoiceRow } from "../integration/fortnox/invoicing-gateway";
import { asVatRows } from "../quote/order-line-schema";

export type FortnoxRowLine = OrderLine & { item: { entityTypeId: string } | null };

export type FortnoxRowsInput = {
  lines: readonly FortnoxRowLine[];
  deductions: readonly (InvoiceDeposit & { deposit: { description: string } })[];
  /** The line's revenue account, as the SIE export posts it (ADR 0077). */
  accountOf: (input: { line: FortnoxRowLine }) => string;
  advancesAccount: string;
};

const units = ({ minor }: { minor: number }) => minor / 100;

/** A line with one VAT rate keeps its quantity, price and discount; a bundle splits per rate. */
function lineRows({ line, account }: { line: FortnoxRowLine; account: number }) {
  const vatRows = asVatRows({ value: line.vatRows });
  if (vatRows.length <= 1) {
    return [
      {
        description: line.name,
        quantity: Number(line.quantity),
        price: units({ minor: line.unitPriceMinor }),
        discountPercent: line.discountPercent.toNumber(),
        vatPercent: line.vatRatePercent,
        accountNumber: account,
      },
    ];
  }
  return vatRows.map((row) => ({
    description: `${line.name} (${row.vatRatePercent} %)`,
    quantity: 1,
    price: units({ minor: row.totalExclVatMinor }),
    discountPercent: 0,
    vatPercent: row.vatRatePercent,
    accountNumber: account,
  }));
}

/**
 * The invoice as Fortnox rows (ADR 0090): the frozen lines that count, then one negative row per
 * deducted deposit on the customer advances account without VAT, so revenue stays the lines'.
 */
export function fortnoxRows({
  lines,
  deductions,
  accountOf,
  advancesAccount,
}: FortnoxRowsInput): FortnoxInvoiceRow[] {
  const sold = lines
    .filter((line) => line.inTotal)
    .flatMap((line) => lineRows({ line, account: Number(accountOf({ line })) }));
  const paid = deductions.map((d) => ({
    description: d.deposit.description,
    quantity: 1,
    price: -units({ minor: d.amountMinor }),
    discountPercent: 0,
    vatPercent: 0,
    accountNumber: Number(advancesAccount),
  }));
  return [...sold, ...paid];
}
