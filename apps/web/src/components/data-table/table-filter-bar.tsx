"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { QuerySearch } from "@/components/query-search/query-search";
import type { BuiltTableQuery } from "./table-filter-query";

export type QuickFilterPill = {
  key: string;
  label: string;
  /** The `q` token for this pill (`undefined` for "All"). */
  query: string | undefined;
};

export type TableFilterBarProps = {
  q: string | undefined;
  query: BuiltTableQuery;
  placeholder?: string | undefined;
  pills?: readonly QuickFilterPill[] | undefined;
  onSelectPill?: ((query: string | undefined) => void) | undefined;
  children?: ReactNode;
};

function QuickPills({
  q,
  pills,
  onSelect,
  ariaLabel,
}: {
  q: string | undefined;
  pills: readonly QuickFilterPill[];
  onSelect: (query: string | undefined) => void;
  ariaLabel: string;
}) {
  const current = q?.trim() || undefined;
  return (
    <nav className="flex flex-wrap gap-2" aria-label={ariaLabel}>
      {pills.map((pill) => {
        const active = current === pill.query;
        return (
          <Button
            key={pill.key}
            type="button"
            size="sm"
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            onClick={() => onSelect(pill.query)}
          >
            {pill.label}
          </Button>
        );
      })}
    </nav>
  );
}

/**
 * Standard table toolbar above `PersistedDataTable`: quick-filter pills on the left,
 * `QuerySearch` with qualifier suggestions on the right.
 */
export function TableFilterBar({
  q,
  query,
  placeholder,
  pills,
  onSelectPill,
  children,
}: TableFilterBarProps) {
  const common = useTranslations("common");
  const label = placeholder ?? common("search");
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {children}
      {pills && pills.length > 0 && onSelectPill ? (
        <QuickPills
          q={q}
          pills={pills}
          onSelect={onSelectPill}
          ariaLabel={common("readFilter.label")}
        />
      ) : null}
      <QuerySearch
        value={q}
        label={label}
        submitLabel={common("search")}
        vocabulary={query.vocabulary}
        texts={query.texts}
        catalog={query.catalog}
        className="ml-auto"
      />
    </div>
  );
}
