import type { VatRow } from "./order-line-schema";

/** One part of a bundle line: what it is worth (effective price × quantity) and its VAT rate. */
export type BundlePart = { weightMinor: number; vatRatePercent: number | null };

export type AllocateBundleVatInput = {
  /** The bundle line's total excl. VAT, minor units: what is charged. */
  totalExclVatMinor: number;
  parts: readonly BundlePart[];
};

/** The parts' shares of the bundle price, in the parts' order; they sum to the total exactly. */
export function allocateShares({ totalExclVatMinor, parts }: AllocateBundleVatInput): number[] {
  const weights = parts.map((part) => Math.max(part.weightMinor, 0));
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  if (sum === 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (totalExclVatMinor * weight) / sum);
  const shares = exact.map((value) => Math.floor(value));
  let left = totalExclVatMinor - shares.reduce((acc, share) => acc + share, 0);
  // Largest remainder first; a tie goes to the earlier part, so the result is stable.
  const order = exact
    .map((value, at) => ({ at, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.at - b.at);
  for (const { at } of order) {
    if (left <= 0) break;
    shares[at] = (shares[at] ?? 0) + 1;
    left -= 1;
  }
  return shares;
}

/**
 * ADR 0059: the VAT of a bundle line. Its price (excl. VAT) is allocated across its parts in
 * proportion to their effective price × quantity with largest-remainder rounding, so the parts sum
 * exactly, and each share takes its part's VAT rate. Returns one row per rate (ascending), each
 * with its VAT rounded once; null when the parts carry no value (the line's own rate applies).
 * `missing` is true when a part with a share has no VAT rate (it counts as 0 % until set).
 */
export function allocateBundleVat({ totalExclVatMinor, parts }: AllocateBundleVatInput) {
  const shares = allocateShares({ totalExclVatMinor, parts });
  if (parts.length === 0 || shares.every((share) => share === 0)) return null;
  const byRate = new Map<number, number>();
  let missing = false;
  for (const [at, part] of parts.entries()) {
    const share = shares[at] ?? 0;
    if (share === 0 && part.weightMinor <= 0) continue;
    if (part.vatRatePercent === null) missing = true;
    const rate = part.vatRatePercent ?? 0;
    byRate.set(rate, (byRate.get(rate) ?? 0) + share);
  }
  const rows: VatRow[] = [...byRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([vatRatePercent, excl]) => ({
      vatRatePercent,
      totalExclVatMinor: excl,
      vatMinor: Math.round((excl * vatRatePercent) / 100),
    }));
  return { rows, missing };
}
