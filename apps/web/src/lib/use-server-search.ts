import { useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";

const DEBOUNCE_MS = 250;

export type ServerSearchState<T> = { results: T[]; pending: boolean; errorKey: ErrorKey | null };

export type UseServerSearchInput<T> = {
  query: string;
  /** A server action; keep it stable (a module import), it is not a dependency. */
  search: (input: { query: string }) => Promise<ActionResult<T[]>>;
  /** Off: no request and no results (e.g. while the search is about something else). */
  enabled?: boolean;
  /** Search an empty query too (the first rows), instead of showing nothing. */
  allowEmpty?: boolean;
};

const IDLE = { results: [], pending: false, errorKey: null };

/** Results of a server search, once typing pauses; answers to an older query are dropped. */
export function useServerSearch<T>({
  query,
  search,
  enabled = true,
  allowEmpty = false,
}: UseServerSearchInput<T>): ServerSearchState<T> {
  const [state, setState] = useState<ServerSearchState<T>>(IDLE);
  const latest = useRef(0);
  const callSearch = useRef(search);
  callSearch.current = search;
  useEffect(() => {
    const text = query.trim();
    const call = ++latest.current;
    if (!enabled || (!text && !allowEmpty)) {
      setState(IDLE);
      return;
    }
    setState((current) => ({ ...current, pending: true }));
    const timer = setTimeout(async () => {
      const result = await callSearch.current({ query: text }).catch(() => null);
      if (call !== latest.current) return;
      if (!result) setState({ results: [], pending: false, errorKey: "network" });
      else if (!result.ok) {
        setState({ results: [], pending: false, errorKey: errorKeyForCode(result.error) });
      } else setState({ results: result.value, pending: false, errorKey: null });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, enabled, allowEmpty]);
  return state;
}
