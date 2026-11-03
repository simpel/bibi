import { QUERY_PIECE, QUERY_TOKEN } from "./query-tokens";

/** One `key:value` term: the values are alternatives (`status:Lead,Offer`); `-` negates it. */
export type QueryFilter<K extends string> = { key: K; values: string[]; negated: boolean };

export type ParsedQuery<K extends string> = { text: string; filters: QueryFilter<K>[] };

export type ParseQueryInput<K extends string> = {
  q: string | undefined;
  /** The qualifiers this list understands; any other `key:` stays free text. */
  qualifiers: readonly K[];
};

/** A value split on commas outside quotes, quotes removed, empty pieces dropped. */
const valuesOf = ({ raw }: { raw: string }) =>
  [...raw.matchAll(QUERY_PIECE)]
    .map(([, quoted, bare]) => (quoted ?? bare ?? "").trim())
    .filter((value) => value.length > 0);

/**
 * Splits a GitHub-style search into qualifiers and free text. Quotes keep spaces
 * (`customer:"Volvo Cars"`); an unknown qualifier or an empty value stays free text, so a search
 * never fails.
 */
export function parseQuery<K extends string>({
  q,
  qualifiers,
}: ParseQueryInput<K>): ParsedQuery<K> {
  const words: string[] = [];
  const filters: QueryFilter<K>[] = [];
  for (const [whole, minus, key, value = ""] of (q ?? "").matchAll(QUERY_TOKEN)) {
    const qualifier = qualifiers.find((known) => known === key?.toLowerCase());
    const values = valuesOf({ raw: value });
    if (qualifier && values.length > 0) {
      filters.push({ key: qualifier, values, negated: minus === "-" });
    } else if (!key) {
      words.push(`${minus ?? ""}${value.replaceAll('"', "")}`);
    } else {
      words.push(whole.trim());
    }
  }
  return { text: words.join(" ").trim(), filters };
}
