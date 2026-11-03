import { listWorkOrders } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { WorkOrderListParams } from "../lib/list-params";
import { toWorkOrderRows } from "../lib/work-order-rows";
import { loadWorkOrderListData } from "../load-work-order-list-data";
import { loadWorkOrderQuery } from "../load-work-order-query";
import { WorkOrderSearchBar } from "./work-order-search-bar";
import { WorkOrderTable } from "./work-order-table";

export type WorkOrderListProps = {
  locale: Locale;
  /** Page, size, search (with qualifiers) and sort, read from the URL. */
  params: WorkOrderListParams;
};

/**
 * Work orders page body: header, quick filters and search, then the paged table. Only each
 * work order's latest version is listed; older ones are reached from its detail page.
 */
export async function WorkOrderList({ locale, params }: WorkOrderListProps) {
  const t = await getTranslations("workOrder");
  const [query, data, format] = await Promise.all([
    loadWorkOrderQuery(),
    loadWorkOrderListData(),
    getDateTimeFormat(),
  ]);
  const { vocabulary } = query;
  const q = params.q ?? "";
  const canonical = toCanonicalQuery({ q, vocabulary });
  const result = await runOperation({
    operation: listWorkOrders,
    input: {
      page: params.page,
      limit: params.pageSize,
      sort: params.sort,
      direction: params.direction,
      q: `${canonical} is:current`.trim(),
    },
  });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const { items, total } = result.value;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("list.description")} />
      {total === 0 && !params.q ? (
        <EmptyState title={t("list.empty")} description={t("list.emptyDescription")} />
      ) : (
        <>
          <WorkOrderSearchBar q={q} query={query} data={data} />
          <WorkOrderTable
            rows={toWorkOrderRows({ items, ...data, format })}
            total={total ?? 0}
            view={params}
          />
        </>
      )}
    </div>
  );
}
