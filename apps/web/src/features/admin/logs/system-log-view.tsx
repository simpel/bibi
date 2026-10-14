import { getEnv } from "@okazi/config";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { loadSelectedEntry } from "./load-selected-entry";
import { LogDetailSheet } from "./log-detail-sheet";
import { LogFilters } from "./log-filters";
import { type LogSearchParams, parseLogParams } from "./log-params";
import { LogTable } from "./log-table";

export type SystemLogViewProps = { locale: Locale; params: LogSearchParams };

/** `/admin/logs`: header, filters, paginated table and the selected entry's sheet. */
export async function SystemLogView({ locale, params }: SystemLogViewProps) {
  const t = await getTranslations("admin.logs");
  const { query, selected } = parseLogParams({ params });
  const result = await runPlatformOperation({
    operation: platformOperations().listSystemLogs,
    input: query,
  });
  const days = getEnv().SYSTEM_LOG_RETENTION_DAYS;
  const header = <PageHeader title={t("title")} description={t("description", { days })} />;
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { items, page, pageSize, pageCount, total } = result.value;
  const entry = await loadSelectedEntry({ selected, items });
  return (
    <div className="grid gap-6">
      {header}
      <LogFilters query={query} />
      <LogTable {...{ items, page, pageSize, pageCount, total }} selectedId={selected} />
      <LogDetailSheet selectedId={selected} entry={entry} />
    </div>
  );
}
