import type { PreviewLine } from "@bibi/core";

type Priced = Pick<
  PreviewLine,
  "effectiveQuantity" | "effectiveUnitPriceMinor" | "effectiveDiscountPercent"
>;

/**
 * A line's cost: quantity × unit price less the discount, rounded to whole minor units, the same
 * rule as a quote's line total (`quote/line-totals.ts`). Null when the line has no price.
 */
export function lineCostMinor({ planned }: { planned: Priced | null }): number | null {
  if (!planned || planned.effectiveUnitPriceMinor === null) return null;
  const quantity = planned.effectiveQuantity ?? 0;
  const discount = planned.effectiveDiscountPercent;
  return Math.round((quantity * planned.effectiveUnitPriceMinor * (100 - discount)) / 100);
}

/** A planned line with its add-ons (ADR 0088); a package's lines have none. */
type PricedLine = Priced & { addOns?: readonly Priced[] };

/**
 * The booking's total of the priced lines and their add-ons (each at its own price); null when
 * none has a price (or no preview yet).
 */
export function linesTotalMinor({
  planned,
}: {
  planned: readonly PricedLine[] | null;
}): number | null {
  if (!planned) return null;
  const costs = planned
    .flatMap((line) => [line, ...(line.addOns ?? [])])
    .map((line) => lineCostMinor({ planned: line }))
    .filter((cost): cost is number => cost !== null);
  return costs.length === 0 ? null : costs.reduce((sum, cost) => sum + cost, 0);
}
