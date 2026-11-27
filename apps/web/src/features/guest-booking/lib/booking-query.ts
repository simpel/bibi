import { isIsoDate } from "@bibi/core/schemas";

/** Two guests unless the URL says otherwise: the most common table. */
const DEFAULT_PARTY = 2;

export type ParsePartyInput = { value: string | undefined; max: number };

/** `?party=` as a party size the page takes online (1…max), else the default within it. */
export function parseParty({ value, max }: ParsePartyInput): number {
  const top = Math.max(1, max);
  const asked = Number(value);
  if (Number.isInteger(asked) && asked >= 1 && asked <= top) return asked;
  return Math.min(DEFAULT_PARTY, top);
}

export type ParseDayInput = { value: string | undefined; today: string };

/** `?date=` as a plain day from today on, else today. Both are `YYYY-MM-DD`. */
export function parseDay({ value, today }: ParseDayInput): string {
  if (!value || !isIsoDate({ value })) return today;
  return value < today ? today : value;
}
