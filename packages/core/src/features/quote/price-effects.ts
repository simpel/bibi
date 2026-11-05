import type { LineDto } from "../line/schema";
import type { DerivedLine } from "./derive-lines";
import { lineAmounts } from "./line-totals";

export type ApplyPriceEffectsInput = {
  /** The orders' priced lines as order lines, after alternatives. */
  derived: readonly DerivedLine[];
  /** Every active line of the same orders, priced or not. */
  lines: readonly LineDto[];
};

/**
 * ADR 0082: a parent whose REPLACES options cover only part of its quantity counts the rest at
 * its own price; covered in full (any option of a normal group covers the whole line), it does
 * not count.
 */
function countRemainder({ entry, covered }: { entry: DerivedLine; covered: number }) {
  const remainder = Math.max(0, entry.line.quantity - covered);
  if (remainder === 0) {
    entry.line.inTotal = false;
    return;
  }
  const { unitPriceMinor, discountPercent, vatRatePercent } = entry.line;
  const amounts = lineAmounts({
    quantity: remainder,
    unitPriceMinor,
    discountPercent,
    vatRatePercent,
  });
  Object.assign(entry.line, { quantity: remainder, ...amounts });
  entry.line.vatRows = [{ vatRatePercent, ...amounts }];
}

/**
 * ADR 0059, 0082: an option line counts as its price effect says. INCLUDED never counts (it is in
 * the parent's price); EXTRA counts at its own price and quantity; REPLACES counts and its parent
 * line counts only the quantity no REPLACES option covers. An add-on always counts at its own
 * price and covers nothing (ADR 0088). An option or add-on of a line left out as an unchosen
 * alternative (ADR 0052) is left out with it. Changes the lines in place; run before the bundles'
 * VAT split, which reads the parent's total.
 */
export function applyPriceEffects({ derived, lines }: ApplyPriceEffectsInput) {
  const byId = new Map(lines.map((line) => [line.id, line]));
  const entryOf = new Map(derived.map((entry) => [entry.line.lineId, entry]));
  const leftOut = ({ id }: { id: string | null }): boolean => {
    const line = id ? byId.get(id) : undefined;
    if (!line) return false;
    const entry = entryOf.get(line.id);
    if (entry?.line.alternativeGroupId && !entry.line.inTotal) return true;
    const follows = line.role === "OPTION" || line.role === "ADD_ON";
    return follows && leftOut({ id: line.parentLineId });
  };
  const covered = new Map<string, number>();
  for (const entry of derived) {
    const line = byId.get(entry.line.lineId);
    if (line?.role === "ADD_ON") entry.line.inTotal = !leftOut({ id: line.id });
    if (line?.role !== "OPTION" || !line.priceEffect) continue;
    const counts = line.priceEffect !== "INCLUDED" && !leftOut({ id: line.id });
    entry.line.inTotal = counts;
    if (counts && line.priceEffect === "REPLACES" && line.parentLineId) {
      const before = covered.get(line.parentLineId) ?? 0;
      covered.set(line.parentLineId, before + entry.line.quantity);
    }
  }
  for (const [id, quantity] of covered) {
    const parent = entryOf.get(id);
    if (parent) countRemainder({ entry: parent, covered: quantity });
  }
}
