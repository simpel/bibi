"use client";

import type { SystemLogListQuery } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { buildQueryCatalog } from "@/components/query-search/lib/query-catalog";
import { QuerySearch } from "@/components/query-search/query-search";
import { ActiveFilterChips } from "./active-filter-chips";
import type { loadLogQuery } from "./load-log-query";
import { useLogNavigation } from "./use-log-navigation";

export type LogFiltersProps = {
  query: SystemLogListQuery;
  queryData: Awaited<ReturnType<typeof loadLogQuery>>;
};

function LogQuickPills({
  current,
  onSelect,
}: {
  current: string | undefined;
  onSelect: (q: string | undefined) => void;
}) {
  const common = useTranslations("common");
  const levels = useTranslations("admin.levels");
  const pills = [
    { key: "all", label: common("readFilter.all"), q: undefined },
    { key: "error", label: levels("error"), q: "type:error" },
    { key: "warn", label: levels("warn"), q: "type:warn" },
  ];
  return (
    <>
      {pills.map((pill) => {
        const active = current === pill.q;
        return (
          <Button
            key={pill.key}
            type="button"
            size="sm"
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            onClick={() => onSelect(pill.q)}
          >
            {pill.label}
          </Button>
        );
      })}
    </>
  );
}

/** Search with inline qualifiers (`type:error surface:web`) and quick-filter pills. */
export function LogFilters({ query, queryData }: LogFiltersProps) {
  const t = useTranslations("admin.logs.filters");
  const { navigate } = useLogNavigation();
  const catalog = useMemo(
    () => buildQueryCatalog({ names: {}, vocabulary: queryData.vocabulary }),
    [queryData.vocabulary],
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <LogQuickPills
          current={query.q?.trim() || undefined}
          onSelect={(q) => navigate({ patch: { q: q ?? null } })}
        />
        <ActiveFilterChips query={query} />
      </div>
      <QuerySearch
        value={query.q}
        label={t("search")}
        submitLabel={t("searchSubmit")}
        vocabulary={queryData.vocabulary}
        texts={queryData.texts}
        catalog={catalog}
        className="ml-auto"
      />
    </div>
  );
}
