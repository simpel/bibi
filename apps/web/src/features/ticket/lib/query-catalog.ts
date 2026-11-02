import type { TicketStatusDto } from "@bibi/core/schemas";
import type { QueryCatalog } from "./query-suggestions";
import { fixedValuesOf, type QueryVocabulary } from "./query-vocabulary";

type Named = { name: string };

export type QueryCatalogInput = {
  members: Named[];
  statuses: Pick<TicketStatusDto, "name">[];
  types: Named[];
  customers: Named[];
  contacts: Named[];
  /** The caller may not view customers: no customer or contact names (ADR 0071). */
  customersHidden: boolean;
  vocabulary: QueryVocabulary;
};

const names = ({ rows }: { rows: Named[] }) => [...new Set(rows.map((row) => row.name))];

/**
 * The values the search suggests per qualifier, from what the page already loaded (so only names
 * the caller may view), fixed values in the UI language. Dates and numbers get no values: their
 * syntax is in the qualifier's hint.
 */
export function buildQueryCatalog({
  customersHidden: hidden,
  vocabulary,
  ...input
}: QueryCatalogInput) {
  const fixed = ({ key }: { key: "assignee" | "is" | "holds" | "no" }) =>
    fixedValuesOf({ key, vocabulary }).map(({ word }) => word);
  const people = [...fixed({ key: "assignee" }), ...names({ rows: input.members })];
  const catalog: QueryCatalog = {
    assignee: people,
    follower: people,
    status: names({ rows: input.statuses }),
    type: names({ rows: input.types }),
    customer: hidden ? [] : names({ rows: input.customers }),
    contact: hidden ? [] : names({ rows: input.contacts }),
    is: fixed({ key: "is" }),
    holds: fixed({ key: "holds" }),
    no: fixed({ key: "no" }),
  };
  return catalog;
}
