import { allocateShares } from "../quote/bundle-vat";
import { asVatRows } from "../quote/order-line-schema";

/** One VAT rate of an amount: the part excluding VAT and the VAT on it. */
export type VatPart = { vatRatePercent: number; exclVatMinor: number; vatMinor: number };

type Scalable = { exclVatMinor: number; vatMinor: number };

/** Parts scaled to an amount paid against them (incl. VAT), so a part payment splits pro rata. */
export function scaleParts<T extends Scalable>({
  parts,
  amountMinor,
}: {
  parts: readonly T[];
  amountMinor: number;
}): T[] {
  const weights = parts.map((part) => ({
    weightMinor: part.exclVatMinor + part.vatMinor,
    vatRatePercent: null,
  }));
  const shares = allocateShares({ totalExclVatMinor: amountMinor, parts: weights });
  return parts.map((part, at) => {
    const share = shares[at] ?? 0;
    const gross = part.exclVatMinor + part.vatMinor;
    const vatMinor = gross === 0 ? 0 : Math.round((share * part.vatMinor) / gross);
    return { ...part, exclVatMinor: share - vatMinor, vatMinor };
  });
}

/** A deposit's stored VAT split as parts (ADR 0093); `[]` when it carries no VAT. */
export const vatParts = ({ vatRows }: { vatRows: unknown }): VatPart[] =>
  asVatRows({ value: vatRows }).map((row) => ({
    vatRatePercent: row.vatRatePercent,
    exclVatMinor: row.totalExclVatMinor,
    vatMinor: row.vatMinor,
  }));
