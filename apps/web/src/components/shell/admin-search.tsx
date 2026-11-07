"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link, useRouter } from "@/lib/navigation";
import type { AdminGroup } from "./admin-items";
import {
  adminSearchIndex,
  adminSectionHref,
  type SearchableEntry,
  searchAdmin,
} from "./admin-search-index";

export type AdminSearchFieldProps = {
  query: string;
  onQueryChange: (query: string) => void;
  /** The first result, opened with Enter. */
  first: SearchableEntry | undefined;
};

/** The search box at the top of the administration sidebar. */
export function AdminSearchField({ query, onQueryChange, first }: AdminSearchFieldProps) {
  const t = useTranslations("adminArea.search");
  const router = useRouter();
  return (
    <SidebarGroup className="py-0">
      <SidebarGroupContent className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50" />
        <SidebarInput
          type="search"
          value={query}
          aria-label={t("label")}
          placeholder={t("placeholder")}
          className="pl-8"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onQueryChange("");
            if (event.key === "Enter" && first) {
              event.preventDefault();
              router.push(adminSectionHref({ entry: first }));
              onQueryChange("");
            }
          }}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export type UseAdminSearchInput = { query: string; groups: readonly AdminGroup[] };

/** The index with its texts in the user's language, searched for `query`. */
export function useAdminSearch({ query, groups }: UseAdminSearchInput): SearchableEntry[] {
  const t = useTranslations("adminArea.search.entries");
  const nav = useTranslations("nav");
  const entries = useMemo(
    () =>
      adminSearchIndex({ groups }).map((entry) => ({
        ...entry,
        label: t(`${entry.id}.label`),
        keywords: t(`${entry.id}.keywords`),
        pageLabel: nav(entry.page),
      })),
    [t, nav, groups],
  );
  return useMemo(() => searchAdmin({ entries, query }), [entries, query]);
}

export type AdminSearchResultsProps = {
  results: readonly SearchableEntry[];
  onPick: () => void;
};

/** What the search found, in place of the groups while there is a query. */
export function AdminSearchResults({ results, onPick }: AdminSearchResultsProps) {
  const t = useTranslations("adminArea.search");
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        {results.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">{t("noResults")}</p>
        ) : (
          <SidebarMenu aria-label={t("results")}>
            {results.map((entry) => (
              <SidebarMenuItem key={entry.id}>
                <SidebarMenuButton asChild className="h-auto py-1.5">
                  <Link href={adminSectionHref({ entry })} onClick={onPick}>
                    <span className="grid min-w-0">
                      <span className="truncate">{entry.label}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.pageLabel}
                      </span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
