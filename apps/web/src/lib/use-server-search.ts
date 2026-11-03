import type { ActionResult } from "@/lib/action-result";
import type { ErrorKey } from "@/lib/error-key";
import { useLiveQuery } from "@/lib/use-live-query";

const DEBOUNCE_MS = 250;

export type ServerSearchState<T> = { results: T[]; pending: boolean; errorKey: ErrorKey | null };

export type UseServerSearchInput<T> = {
  query: string;
  /** A server action. */
  search: (input: { query: string }) => Promise<ActionResult<T[]>>;
  /** Off: no request and no results (e.g. while the search is about something else). */
  enabled?: boolean;
  /** Search an empty query too (the first rows), instead of showing nothing. */
  allowEmpty?: boolean;
};

/** Results of a server search, once typing pauses; answers to an older query are dropped. */
export function useServerSearch<T>({
  query,
  search,
  enabled = true,
  allowEmpty = false,
}: UseServerSearchInput<T>): ServerSearchState<T> {
  const text = query.trim();
  const asking = enabled && (text !== "" || allowEmpty);
  const state = useLiveQuery({
    input: asking ? { query: text } : null,
    load: search,
    waitMs: DEBOUNCE_MS,
  });
  if (state.status === "ready") return { results: state.value, pending: false, errorKey: null };
  if (state.status === "error") return { results: [], pending: false, errorKey: state.errorKey };
  if (state.status === "loading") {
    return { results: state.previous ?? [], pending: true, errorKey: null };
  }
  return { results: [], pending: false, errorKey: null };
}
