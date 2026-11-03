import type { QueryCatalog } from "./query-suggestion-types";
import { fixedValuesOf, type QueryVocabulary } from "./query-vocabulary";

type Named = { name: string };

export type QueryCatalogInput = {
  /**
   * The names a qualifier offers from what the page already loaded (only names the caller may
   * view, ADR 0071): `status`, `type`, `contact`, `definition`, …
   */
  names: Record<string, Named[]>;
  vocabulary: QueryVocabulary;
};

/** The distinct names of some rows. */
export const namesOf = ({ rows }: { rows: Named[] }) => [...new Set(rows.map((row) => row.name))];

/**
 * The values the search offers: the given names and each qualifier's fixed values in the UI
 * language. Members and customers come from a server search while typing; dates and numbers get no
 * values, their syntax is in the hint.
 */
export function buildQueryCatalog({ names, vocabulary }: QueryCatalogInput): QueryCatalog {
  const fixed = vocabulary.qualifiers.map((key) => [
    key,
    fixedValuesOf({ key, vocabulary }).map(({ word }) => word),
  ]);
  const named = Object.entries(names).map(([key, rows]) => [key, namesOf({ rows })]);
  return Object.fromEntries([...fixed, ...named].filter(([, values]) => values?.length));
}
