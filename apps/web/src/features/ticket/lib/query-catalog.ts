import {
  TICKET_EMPTY_FIELDS,
  TICKET_HOLDS_VALUES,
  TICKET_IS_VALUES,
  type TicketStatusDto,
} from "@bibi/core/schemas";
import type { QueryCatalog } from "./query-suggestions";

type Named = { name: string };

export type QueryCatalogInput = {
  members: Named[];
  statuses: Pick<TicketStatusDto, "name">[];
  types: Named[];
  customers: Named[];
  contacts: Named[];
  /** The caller may not view customers: no customer or contact names (ADR 0071). */
  customersHidden: boolean;
};

const names = ({ rows }: { rows: Named[] }) => [...new Set(rows.map((row) => row.name))];

/**
 * The values the search suggests per qualifier, from what the page already loaded (so only names
 * the caller may view). Dates and numbers get no values: their syntax is in the qualifier's hint.
 */
export function buildQueryCatalog({ customersHidden: hidden, ...input }: QueryCatalogInput) {
  const people = ["me", ...names({ rows: input.members })];
  const catalog: QueryCatalog = {
    assignee: people,
    follower: people,
    status: names({ rows: input.statuses }),
    type: names({ rows: input.types }),
    customer: hidden ? [] : names({ rows: input.customers }),
    contact: hidden ? [] : names({ rows: input.contacts }),
    is: [...TICKET_IS_VALUES],
    holds: [...TICKET_HOLDS_VALUES],
    no: [...TICKET_EMPTY_FIELDS],
  };
  return catalog;
}
