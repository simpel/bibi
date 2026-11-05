import { listRunSheets } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { RunSheetListParams } from "../lib/list-params";
import { toRunSheetRows } from "../lib/run-sheet-rows";
import { loadRunSheetListData } from "../load-run-sheet-list-data";
import { loadRunSheetQuery } from "../load-run-sheet-query";
import { RunSheetSearchBar } from "./run-sheet-search-bar";
import { RunSheetTable } from "./run-sheet-table";

export type RunSheetListProps = {
  locale: Locale;
  /** Page, size, search (with qualifiers) and sort, read from the URL. */
  params: RunSheetListParams;
};

/**
 * Run sheets page body: header, quick filters and search, then the paged table. Only each
 * run sheet's latest version is listed; older ones are reached from its detail page.
 */
export async function RunSheetList({ locale, params }: RunSheetListProps) {
  const t = await getTranslations("runSheet");
  // The list's search text needs the vocabulary, but not the table data or the format.
  const query = await loadRunSheetQuery();
  const { vocabulary } = query;
  const q = params.q ?? "";
  const canonical = toCanonicalQuery({ q, vocabulary });
  const [data, format, result] = await Promise.all([
    loadRunSheetListData(),
    getDateTimeFormat(),
    runOperation({
      operation: listRunSheets,
      input: {
        page: params.page,
        limit: params.pageSize,
        sort: params.sort,
        direction: params.direction,
        q: `${canonical} is:current`.trim(),
      },
    }),
  ]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const { items, total } = result.value;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("list.description")} />
      {total === 0 && !params.q ? (
        <EmptyState title={t("list.empty")} description={t("list.emptyDescription")} />
      ) : (
        <>
          <RunSheetSearchBar q={q} query={query} data={data} />
          <RunSheetTable
            rows={toRunSheetRows({ items, ...data, format })}
            total={total ?? 0}
            view={params}
          />
        </>
      )}
    </div>
  );
}
