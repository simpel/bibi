import { useEffect, useRef, useState } from "react";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { type CustomerOption, searchCustomersAction } from "../../customer/actions";

const DEBOUNCE_MS = 250;

export type CustomerSearchState = {
  results: CustomerOption[];
  pending: boolean;
  errorKey: ErrorKey | null;
};

/**
 * Customers whose name contains `query`, searched on the server (`customer.list`) once typing
 * pauses. Answers to an older query are dropped.
 */
export function useCustomerSearch({ query }: { query: string }): CustomerSearchState {
  const [state, setState] = useState<CustomerSearchState>({
    results: [],
    pending: false,
    errorKey: null,
  });
  const latest = useRef(0);
  useEffect(() => {
    const text = query.trim();
    const call = ++latest.current;
    if (!text) {
      setState({ results: [], pending: false, errorKey: null });
      return;
    }
    setState((current) => ({ ...current, pending: true }));
    const timer = setTimeout(async () => {
      const result = await searchCustomersAction({ query: text }).catch(() => null);
      if (call !== latest.current) return;
      if (!result) setState({ results: [], pending: false, errorKey: "network" });
      else if (!result.ok) {
        setState({ results: [], pending: false, errorKey: errorKeyForCode(result.error) });
      } else setState({ results: result.value, pending: false, errorKey: null });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  return state;
}
