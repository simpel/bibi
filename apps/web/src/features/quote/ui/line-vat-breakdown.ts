import type { OrderLineDto, VatRow } from "@bibi/core/schemas";

export type LineVatBreakdown = {
  rows: readonly VatRow[];
  /** Sum of the rows' bases: equals the line's total excl. VAT. */
  baseMinor: number;
  /** Sum of the rows' VAT: equals the line's VAT. */
  vatMinor: number;
};

/**
 * The frozen VAT rows of a line that carries more than one rate (a bundle with parts at different
 * rates, ADR 0059); null for an ordinary line, whose single rate the VAT column already shows.
 */
export function lineVatBreakdown({
  line,
}: {
  line: Pick<OrderLineDto, "vatRows">;
}): LineVatBreakdown | null {
  const { vatRows } = line;
  if (vatRows.length < 2) return null;
  return {
    rows: vatRows,
    baseMinor: vatRows.reduce((sum, row) => sum + row.totalExclVatMinor, 0),
    vatMinor: vatRows.reduce((sum, row) => sum + row.vatMinor, 0),
  };
}
