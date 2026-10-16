export type LineAmountsInput = {
  quantity: number;
  unitPriceMinor: number;
  discountPercent: number;
  vatRatePercent: number;
};

export type LineAmounts = { totalExclVatMinor: number; vatMinor: number };

/** quantity × unit price less the discount, and the VAT on it, each rounded to whole minor units. */
export function lineAmounts({
  quantity,
  unitPriceMinor,
  discountPercent,
  vatRatePercent,
}: LineAmountsInput): LineAmounts {
  const totalExclVatMinor = Math.round((quantity * unitPriceMinor * (100 - discountPercent)) / 100);
  const vatMinor = Math.round((totalExclVatMinor * vatRatePercent) / 100);
  return { totalExclVatMinor, vatMinor };
}

export type QuoteTotals = { totalExclVatMinor: number; totalInclVatMinor: number };

/** The quote's totals: the sums of its lines. */
export function quoteTotals({ lines }: { lines: readonly LineAmounts[] }): QuoteTotals {
  let excl = 0;
  let vat = 0;
  for (const line of lines) {
    excl += line.totalExclVatMinor;
    vat += line.vatMinor;
  }
  return { totalExclVatMinor: excl, totalInclVatMinor: excl + vat };
}
