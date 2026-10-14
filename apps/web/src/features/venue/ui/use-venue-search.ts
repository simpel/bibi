"use client";

import { useEffect, useState, useTransition } from "react";
import { searchAction } from "@/features/search/actions";
import type { SearchHitView } from "@/features/search/search-hit-view";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";

const DEBOUNCE_MS = 300;

export type UseVenueSearchInput = { query: string };

/** Debounced semantic search via the `searchAction` server action. `hits === null` = idle. */
export function useVenueSearch({ query }: UseVenueSearchInput) {
  const [hits, setHits] = useState<SearchHitView[] | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") {
      setHits(null);
      setErrorKey(null);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await searchAction({ query: trimmed });
        setErrorKey(result.ok ? null : errorKeyForCode({ code: result.error.code }));
        setHits(result.ok ? result.value : []);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return { hits, errorKey, pending };
}
