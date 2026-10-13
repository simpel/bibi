"use client";

import { Button, Input } from "@okazi/ui";
import { SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { searchAction } from "@/features/search/actions";
import type { SearchHitView } from "@/features/search/search-hit-view";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { VenueSearchResults } from "./venue-search-results";

const DEBOUNCE_MS = 300;

/** Semantic search box (core `search` operation) shown above the venue list. */
export function VenueSearch() {
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHitView[] | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") {
      setHits(null);
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

  return (
    <section className="grid gap-3" aria-label={t("label")}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("label")}
          className="pl-9 pr-9"
        />
        {query ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            aria-label={t("clear")}
            onClick={() => setQuery("")}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
      <VenueSearchResults hits={hits} pending={pending} errorKey={errorKey} query={query.trim()} />
    </section>
  );
}
