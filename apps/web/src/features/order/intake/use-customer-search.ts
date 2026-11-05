import { type ServerSearchState, useServerSearch } from "@/lib/use-server-search";
import { type CustomerOption, searchCustomersAction } from "../../customer/actions";

export type CustomerSearchState = ServerSearchState<CustomerOption>;

/**
 * Customers whose name contains `query`, searched on the server (`customer.list`) once typing
 * pauses. Answers to an older query are dropped.
 */
export function useCustomerSearch({ query }: { query: string }): CustomerSearchState {
  return useServerSearch({ query, search: searchCustomersAction });
}
