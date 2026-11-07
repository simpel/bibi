"use client";

import type { PermissionSet } from "@bibi/core";
import { CommandGroup, CommandItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { type AdminGroup, type AdminKey, visibleAdminGroups } from "./admin-items";
import {
  adminSearchIndex,
  adminSectionHref,
  type SearchableEntry,
  searchAdmin,
} from "./admin-search-index";

/** At most this many settings in the command bar; the best matches come first. */
const MAX_RESULTS = 8;

export type UseAdminSearchInput = { query: string; groups: readonly AdminGroup[] };

/** The settings index with its texts in the user's language, searched for `query`. */
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

export type AdminCommandGroupProps = {
  query: string;
  permissions: PermissionSet;
  onGo: (target: { href: string }) => void;
};

/**
 * "Settings" in the command bar: every administration section the caller may view, found by its
 * name, page or keywords, opening the page at the section. Only while there is a query; the
 * matching is ours (diacritics folded), so the items bypass cmdk's own filter.
 */
export function AdminCommandGroup({ query, permissions, onGo }: AdminCommandGroupProps) {
  const t = useTranslations("commandBar");
  const groups = useMemo(() => visibleAdminGroups({ permissions }), [permissions]);
  const icons = useMemo(
    () =>
      new Map<AdminKey, AdminGroup["pages"][number]["icon"]>(
        groups.flatMap((group) => group.pages.map((page) => [page.key, page.icon] as const)),
      ),
    [groups],
  );
  const results = useAdminSearch({ query, groups }).slice(0, MAX_RESULTS);
  if (results.length === 0) return null;
  return (
    <CommandGroup forceMount heading={t("settings")}>
      {results.map((entry) => {
        const Icon = icons.get(entry.page);
        return (
          <CommandItem
            key={entry.id}
            forceMount
            value={`settings:${entry.id}`}
            onSelect={() => onGo({ href: adminSectionHref({ entry }) })}
          >
            {Icon ? <Icon /> : null}
            <span className="truncate">{entry.label}</span>
            <span className="ml-auto truncate text-xs text-muted-foreground">
              {entry.pageLabel}
            </span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
