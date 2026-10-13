"use client";

import { Badge, Card, Skeleton } from "@okazi/ui";
import { Link } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/states/error-banner";
import type { SearchHitView } from "@/features/search/search-hit-view";
import type { ErrorKey } from "@/lib/error-key";
import { venueRoute } from "@/lib/routes";

export type VenueSearchResultsProps = {
  hits: SearchHitView[] | null;
  pending: boolean;
  errorKey: ErrorKey | null;
  query: string;
};

export function VenueSearchResults({ hits, pending, errorKey, query }: VenueSearchResultsProps) {
  const t = useTranslations("search");
  if (errorKey) return <ErrorBanner errorKey={errorKey} />;
  if (pending) return <Skeleton className="h-16 w-full" />;
  if (hits === null) return null;
  if (hits.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noResults", { query })}</p>;
  }
  return (
    <Card className="divide-y">
      <p className="px-4 py-2 text-xs text-muted-foreground">{t("results", { count: hits.length })}</p>
      {hits.map((hit) => (
        <Link
          key={`${hit.entityType}-${hit.entityId}`}
          href={venueRoute({ id: hit.venueId })}
          className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-accent"
        >
          <span className="grid">
            <span className="font-medium">{hit.title}</span>
            <span className="text-sm text-muted-foreground">{hit.snippet}</span>
          </span>
          <Badge variant="secondary">{t(`entity.${hit.entityType}`)}</Badge>
        </Link>
      ))}
    </Card>
  );
}
