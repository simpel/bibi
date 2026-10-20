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

type CountedLine = LineAmounts & { inTotal: boolean };

/** The quote's totals: the sums of the lines that count (`inTotal`, ADR 0052). */
export function quoteTotals({ lines }: { lines: readonly CountedLine[] }): QuoteTotals {
  let excl = 0;
  let vat = 0;
  for (const line of lines) {
    if (!line.inTotal) continue;
    excl += line.totalExclVatMinor;
    vat += line.vatMinor;
  }
  return { totalExclVatMinor: excl, totalInclVatMinor: excl + vat };
}

type GroupedLine = { alternativeGroupChosen: boolean | null };

/** ADR 0052: the totals are "from" prices while some alternative group is not chosen. */
export const totalIsFrom = ({ lines }: { lines: readonly GroupedLine[] }): boolean =>
  lines.some((line) => line.alternativeGroupChosen === false);
