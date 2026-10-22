"use client";

import type { SearchHitWire } from "@bibi/ai";
import { useEffect, useState } from "react";
import { enrichSearchHitsAction } from "@/features/search/actions";
import type { SearchHitView } from "@/features/search/search-hit-view";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";

export type UseEnrichedHitsInput = { hits: SearchHitWire[] };

/** Search hits from a tool result, resolved to titles and venue links (null = loading). */
export function useEnrichedHits({ hits }: UseEnrichedHitsInput) {
  const [views, setViews] = useState<SearchHitView[] | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  useEffect(() => {
    let cancelled = false;
    void enrichSearchHitsAction({ hits }).then((result) => {
      if (cancelled) return;
      setErrorKey(result.ok ? null : errorKeyForCode({ code: result.error.code }));
      setViews(result.ok ? result.value : []);
    });
    return () => {
      cancelled = true;
    };
  }, [hits]);
  return { views, errorKey };
}
