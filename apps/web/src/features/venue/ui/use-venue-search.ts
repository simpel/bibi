"use client";

import { searchAction } from "@/features/search/actions";
import type { SearchHitView } from "@/features/search/search-hit-view";
import type { ErrorKey } from "@/lib/error-key";
import { useLiveQuery } from "@/lib/use-live-query";

const DEBOUNCE_MS = 300;

export type UseVenueSearchInput = { query: string };

/** Debounced semantic search via the `searchAction` server action. `hits === null` = idle. */
export function useVenueSearch({ query }: UseVenueSearchInput): {
  hits: SearchHitView[] | null;
  errorKey: ErrorKey | null;
  pending: boolean;
} {
  const trimmed = query.trim();
  const state = useLiveQuery({
    input: trimmed === "" ? null : { query: trimmed },
    load: searchAction,
    waitMs: DEBOUNCE_MS,
  });
  if (state.status === "ready") return { hits: state.value, errorKey: null, pending: false };
  if (state.status === "error") return { hits: [], errorKey: state.errorKey, pending: false };
  if (state.status === "loading") return { hits: state.previous, errorKey: null, pending: true };
  return { hits: null, errorKey: null, pending: false };
}
