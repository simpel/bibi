"use client";

import { useTranslations } from "next-intl";
import { VenueSearchResults } from "@/features/venue/ui/venue-search-results";
import type { GenerativeProps } from "./generative-props";
import { useEnrichedHits } from "./use-enriched-hits";

export type SearchResultsViewProps = GenerativeProps<"search-results">;

/** Semantic search hits (same list as the venues page), each linking to its venue. */
export function SearchResultsView({ hits }: SearchResultsViewProps) {
  const t = useTranslations("assistant.ui");
  const { views, errorKey } = useEnrichedHits({ hits });
  if (hits.length === 0) return <p className="text-sm text-muted-foreground">{t("noHits")}</p>;
  return (
    <div data-slot="search-results">
      <VenueSearchResults hits={views} pending={views === null} errorKey={errorKey} query="" />
    </div>
  );
}
