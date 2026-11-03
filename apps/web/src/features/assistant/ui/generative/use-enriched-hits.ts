"use client";

import type { SearchHitWire } from "@bibi/ai";
import { enrichSearchHitsAction } from "@/features/search/actions";
import type { SearchHitView } from "@/features/search/search-hit-view";
import type { ErrorKey } from "@/lib/error-key";
import { useLiveQuery } from "@/lib/use-live-query";

export type UseEnrichedHitsInput = { hits: SearchHitWire[] };

/** Search hits from a tool result, resolved to titles and venue links (null = loading). */
export function useEnrichedHits({ hits }: UseEnrichedHitsInput): {
  views: SearchHitView[] | null;
  errorKey: ErrorKey | null;
} {
  const state = useLiveQuery({ input: { hits }, load: enrichSearchHitsAction });
  if (state.status === "ready") return { views: state.value, errorKey: null };
  if (state.status === "error") return { views: [], errorKey: state.errorKey };
  return { views: state.status === "loading" ? state.previous : null, errorKey: null };
}
