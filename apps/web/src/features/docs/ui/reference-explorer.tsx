"use client";

import { Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { type EntryGroup, filterEntries } from "../reference/filter-entries";
import type { ReferenceEntry } from "../reference/types";
import { ReferenceEntryCard } from "./reference-entry-card";

export type ReferenceExplorerProps = { entries: ReferenceEntry[] };

type GroupNavProps = { groups: EntryGroup[]; label: string };

function GroupNav({ groups, label }: GroupNavProps) {
  return (
    <nav aria-label={label} className="hidden lg:block">
      <ul className="sticky top-20 grid max-h-[calc(100vh-6rem)] gap-0.5 overflow-y-auto text-sm">
        {groups.map(({ group, entries: list }) => (
          <li key={group}>
            <a
              href={`#group-${group}`}
              className="flex justify-between rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span className="truncate">{group}</span>
              <span className="tabular-nums">{list.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Searchable, grouped list of MCP tools (MCP tools). */
export function ReferenceExplorer({ entries }: ReferenceExplorerProps) {
  const t = useTranslations("docs.reference");
  const [query, setQuery] = useState("");
  const groups = useMemo(() => filterEntries({ entries, query }), [entries, query]);
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <GroupNav groups={groups} label={t("groups")} />
      <div className="grid min-w-0 content-start gap-8">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
        />
        {groups.length === 0 && <p className="text-sm text-muted-foreground">{t("noResults")}</p>}
        {groups.map(({ group, entries: list }) => (
          <section key={group} id={`group-${group}`} className="grid min-w-0 scroll-mt-20 gap-2">
            <h2 className="font-mono text-base font-semibold">{group}</h2>
            {list.map((entry) => (
              <ReferenceEntryCard key={entry.id} entry={entry} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
