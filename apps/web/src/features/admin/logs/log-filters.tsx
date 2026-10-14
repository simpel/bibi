"use client";

import { LOG_LEVELS, type SystemLogListQuery } from "@okazi/core/schemas";
import { SURFACES } from "@okazi/logger/surfaces";
import { useTranslations } from "next-intl";
import { ActiveFilterChips } from "./active-filter-chips";
import { FilterSelect } from "./filter-select";
import { LogSearch } from "./log-search";
import { useLogNavigation } from "./use-log-navigation";

const SURFACE_OPTIONS = SURFACES.map((surface) => ({ value: surface, label: surface }));

export type LogFiltersProps = { query: SystemLogListQuery };

/** Search, minimum level, surface, and the active-filter chips. All state lives in the URL. */
export function LogFilters({ query }: LogFiltersProps) {
  const t = useTranslations("admin.logs.filters");
  const levels = useTranslations("admin.levels");
  const { navigate } = useLogNavigation();
  const levelOptions = LOG_LEVELS.map((level) => ({ value: level, label: levels(level) }));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <LogSearch value={query.q} onSearch={(q) => navigate({ patch: { q } })} />
      <FilterSelect
        className="w-40"
        label={t("level")}
        allLabel={t("allLevels")}
        value={query.level}
        options={levelOptions}
        onChange={(level) => navigate({ patch: { level } })}
      />
      <FilterSelect
        className="w-36"
        label={t("surface")}
        allLabel={t("allSurfaces")}
        value={query.surface}
        options={SURFACE_OPTIONS}
        onChange={(surface) => navigate({ patch: { surface } })}
      />
      <ActiveFilterChips query={query} />
    </div>
  );
}
