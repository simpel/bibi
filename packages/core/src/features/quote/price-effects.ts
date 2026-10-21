import type { LineDto } from "../line/schema";
import type { DerivedLine } from "./derive-lines";

export type ApplyPriceEffectsInput = {
  /** The tickets' priced lines as order lines, after alternatives and bundles. */
  derived: readonly DerivedLine[];
  /** Every active line of the same tickets, priced or not. */
  lines: readonly LineDto[];
};

/**
 * ADR 0059: an option line counts as its price effect says. INCLUDED never counts (it is in the
 * parent's price); EXTRA counts at its own price; REPLACES counts and its parent line does not.
 * An option of a line left out as an unchosen alternative (ADR 0052) is left out with it.
 * Changes the lines in place.
 */
export function applyPriceEffects({ derived, lines }: ApplyPriceEffectsInput) {
  const byId = new Map(lines.map((line) => [line.id, line]));
  const entryOf = new Map(derived.map((entry) => [entry.line.lineId, entry]));
  const leftOut = ({ id }: { id: string | null }): boolean => {
    const line = id ? byId.get(id) : undefined;
    if (!line) return false;
    const entry = entryOf.get(line.id);
    if (entry?.line.alternativeGroupId && !entry.line.inTotal) return true;
    return line.priceEffect !== null && leftOut({ id: line.parentLineId });
  };
  const replaced: string[] = [];
  for (const entry of derived) {
    const line = byId.get(entry.line.lineId);
    if (!line?.priceEffect) continue;
    const counts = line.priceEffect !== "INCLUDED" && !leftOut({ id: line.id });
    entry.line.inTotal = counts;
    if (counts && line.priceEffect === "REPLACES" && line.parentLineId) {
      replaced.push(line.parentLineId);
    }
  }
  for (const id of replaced) {
    const parent = entryOf.get(id);
    if (parent) parent.line.inTotal = false;
  }
}
