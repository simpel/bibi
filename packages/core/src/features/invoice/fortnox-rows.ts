import type { InvoiceDeposit, OrderLine } from "@bibi/db";
import { scaleParts } from "../../accounting/sie4/sale";
import { vatParts } from "../finance/account-map";
import type { FortnoxInvoiceRow } from "../integration/fortnox/invoicing-gateway";
import { asVatRows } from "../quote/order-line-schema";

export type FortnoxRowLine = OrderLine & { item: { entityTypeId: string } | null };

type FortnoxDeduction = InvoiceDeposit & { deposit: { description: string; vatRows: unknown } };

export type FortnoxRowsInput = {
  lines: readonly FortnoxRowLine[];
  deductions: readonly FortnoxDeduction[];
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
 * A deducted deposit as negative rows on the customer advances account (ADR 0093): one per VAT
 * rate of its split, priced excl. VAT, so the invoice's VAT is net of what was reported when the
 * deposit was paid. A deposit without a split is one row without VAT.
 */
function deductionRows({ deduction, account }: { deduction: FortnoxDeduction; account: number }) {
  const { description } = deduction.deposit;
  const parts = vatParts({ vatRows: deduction.deposit.vatRows });
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
export function fortnoxRows({
  lines,
  deductions,
  accountOf,
  advancesAccount,
}: FortnoxRowsInput): FortnoxInvoiceRow[] {
  const sold = lines
    .filter((line) => line.inTotal)
    .flatMap((line) => lineRows({ line, account: Number(accountOf({ line })) }));
  const account = Number(advancesAccount);
  const paid = deductions.flatMap((deduction) => deductionRows({ deduction, account }));
  return [...sold, ...paid];
}
