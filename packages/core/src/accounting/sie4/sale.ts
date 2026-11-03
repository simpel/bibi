import { allocateShares } from "../../features/quote/bundle-vat";
import type { AccountMap, RevenuePart } from "./accounts";
import type { SieTransaction } from "./types";

const MAX_ROUNDING_MINOR = 100;

export type Build = { accounts: AccountMap; project: { dimension: number; id: string }[] };
const add = ({ map, key, minor }: { map: Map<string, number>; key: string; minor: number }) =>
  map.set(key, (map.get(key) ?? 0) + minor);

/** Credits per revenue account and per output VAT account (`missingVatRates` checked first). */
export function saleCredits({
  accounts,
  project,
  parts,
}: Build & { parts: readonly RevenuePart[] }) {
  const byAccount = new Map<string, number>();
  for (const part of parts) {
    add({ map: byAccount, key: part.account, minor: part.exclVatMinor });
    const vat = accounts.vatOutput[part.vatRatePercent];
    if (vat && part.vatMinor !== 0) add({ map: byAccount, key: vat, minor: part.vatMinor });
  }
  return [...byAccount].map(([account, minor]) => ({
    account,
    amountMinor: -minor,
    objects: project,
  }));
}

/** Balances a sale against its total: a rounding difference goes to the rounding account. */
export function withRounding({
  accounts,
  lines,
}: {
  accounts: AccountMap;
  lines: SieTransaction[];
}) {
  const off = lines.reduce((sum, line) => sum + line.amountMinor, 0);
  // More than a krona is a real gap, not rounding: left unbalanced so `checkBalanced` refuses it.
  if (off === 0 || Math.abs(off) > MAX_ROUNDING_MINOR) return lines;
  return [...lines, { account: accounts.rounding, amountMinor: -off }];
}

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
