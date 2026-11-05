import { getEnv } from "@bibi/config";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { loadLogQuery } from "./load-log-query";
import { loadSelectedEntry } from "./load-selected-entry";
import { LogDetailSheet } from "./log-detail-sheet";
import { LogFilters } from "./log-filters";
import { type LogSearchParams, parseLogParams } from "./log-params";
import { LogTable } from "./log-table";

export type SystemLogViewProps = { locale: Locale; params: LogSearchParams };

type ErrorLayoutProps = {
  header: ReactNode;
  errorKey: Parameters<typeof ErrorState>[0]["errorKey"];
};

function ErrorLayout({ header, errorKey }: ErrorLayoutProps) {
  return (
    <div className="grid gap-6">
      {header}
      <ErrorState errorKey={errorKey} />
    </div>
  );
}

/** `/admin/logs`: header, inline qualifier search, paginated table and the detail sheet. */
export async function SystemLogView({ locale, params }: SystemLogViewProps) {
  const [t, queryData] = await Promise.all([getTranslations("admin.logs"), loadLogQuery()]);
  const { query, selected } = parseLogParams({ params });
  const q = query.q
    ? toCanonicalQuery({ q: query.q, vocabulary: queryData.vocabulary })
    : undefined;
  const result = await runPlatformOperation({
    operation: platformOperations().listSystemLogs,
    input: { ...query, ...(q ? { q } : {}) },
  });
  const days = getEnv().SYSTEM_LOG_RETENTION_DAYS;
  const header = <PageHeader title={t("title")} description={t("description", { days })} />;
  if (!result.ok) {
    return (
      <ErrorLayout header={header} errorKey={handleLoadError({ error: result.error, locale })} />
    );
  }
  const { items, page, pageSize, pageCount, total } = result.value;
  const entry = await loadSelectedEntry({ selected, items });
  return (
    <div className="grid gap-6">
      {header}
      <LogFilters query={query} queryData={queryData} />
      <LogTable
        {...{ items, pageCount, total }}
        view={{ page, pageSize, sort: query.sort, direction: query.direction }}
        selectedId={selected}
      />
      <LogDetailSheet selectedId={selected} entry={entry} />
    </div>
  );
}
