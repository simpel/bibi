import type { TicketStatusDto } from "@bibi/core/schemas";
import type { QueryCatalog } from "./query-suggestion-types";
import { fixedValuesOf, type QueryVocabulary } from "./query-vocabulary";

type Named = { name: string };

export type QueryCatalogInput = {
  statuses: Pick<TicketStatusDto, "name">[];
  types: Named[];
  contacts: Named[];
  /** The caller may not view customers: no contact names (ADR 0071). */
  customersHidden: boolean;
  vocabulary: QueryVocabulary;
};

const names = ({ rows }: { rows: Named[] }) => [...new Set(rows.map((row) => row.name))];

/**
 * The values the search offers from what the page already loaded (only names the caller may
 * view) and the fixed values in the UI language. Members and customers come from a server
 * search while typing; dates and numbers get no values, their syntax is in the hint.
 */
export function buildQueryCatalog({ customersHidden, vocabulary, ...input }: QueryCatalogInput) {
  const fixed = ({ key }: { key: "is" | "holds" | "no" }) =>
    fixedValuesOf({ key, vocabulary }).map(({ word }) => word);
  const catalog: QueryCatalog = {
    status: names({ rows: input.statuses }),
    type: names({ rows: input.types }),
    contact: customersHidden ? [] : names({ rows: input.contacts }),
    is: fixed({ key: "is" }),
    holds: fixed({ key: "holds" }),
    no: fixed({ key: "no" }),
  };
  return catalog;
}
