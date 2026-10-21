import type { LineDto } from "../line/schema";
import { allocateBundleVat } from "./bundle-vat";
import type { DerivedLine } from "./derive-lines";

export type ApplyBundlesInput = {
  /** The tickets' priced lines as order lines. */
  derived: readonly DerivedLine[];
  /** Every active line of the same tickets, priced or not: the parts weigh in by value. */
  lines: readonly LineDto[];
};

/** A part's weight in its bundle: effective unit price × effective quantity (0 while unknown). */
const weightOf = ({ line }: { line: LineDto }) =>
  (line.effectiveUnitPriceMinor ?? 0) * (line.effectiveQuantity ?? 0);

/**
 * ADR 0059: a bundle line carries the price and its VAT is split per rate across its part lines
 * (`allocateBundleVat`); part lines never count in the totals. Changes the lines in place. A
 * bundle line whose parts carry no value keeps its own VAT rate.
 */
export function applyBundles({ derived, lines }: ApplyBundlesInput) {
  const partsOf = new Map<string, LineDto[]>();
  for (const line of lines) {
    if (!line.parentLineId) continue;
    partsOf.set(line.parentLineId, [...(partsOf.get(line.parentLineId) ?? []), line]);
  }
  for (const entry of derived) {
    if (entry.line.parentLineId) entry.line.inTotal = false;
    const parts = partsOf.get(entry.line.lineId);
    if (!parts) continue;
    const split = allocateBundleVat({
      totalExclVatMinor: entry.line.totalExclVatMinor,
      parts: parts.map((part) => ({
        weightMinor: weightOf({ line: part }),
        vatRatePercent: part.effectiveVatRatePercent,
      })),
    });
    if (!split) continue;
    entry.line.vatRows = split.rows;
    entry.line.vatMinor = split.rows.reduce((sum, row) => sum + row.vatMinor, 0);
    // The parts' rates apply, not the bundle line's own.
    entry.missing = entry.missing.filter((field) => field !== "vatRatePercent");
    if (split.missing) entry.missing.push("vatRatePercent");
  }
}
