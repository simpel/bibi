import { getTranslations } from "next-intl/server";
import { buildQueryCatalog } from "@/components/query-search/lib/query-catalog";
import { PeopleQuickFilters } from "@/components/query-search/people-quick-filters";
import { QuerySearch } from "@/components/query-search/query-search";
import { ROUTES } from "@/lib/routes";
import type { WorkOrderListData } from "../load-work-order-list-data";
import type { loadWorkOrderQuery } from "../load-work-order-query";

export type WorkOrderSearchBarProps = {
  /** The search in effect: the URL's, else the default. */
  q: string;
  query: Awaited<ReturnType<typeof loadWorkOrderQuery>>;
  data: WorkOrderListData;
};

/** The quick filters and the search, with the names the search offers. */
export async function WorkOrderSearchBar({ q, query, data }: WorkOrderSearchBarProps) {
  const t = await getTranslations("workOrder.list");
  const { vocabulary, texts } = query;
  const names = {
    status: data.statuses,
    type: data.types,
    definition: data.definitions,
    responsibility: data.responsibilities,
    contact: data.customersHidden ? [] : data.contacts,
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <PeopleQuickFilters pathname={ROUTES.workOrders} q={q} vocabulary={vocabulary} />
      <QuerySearch
        value={q}
        label={t("search")}
        submitLabel={t("searchSubmit")}
        vocabulary={vocabulary}
        texts={texts}
        catalog={buildQueryCatalog({ names, vocabulary })}
      />
    </div>
  );
}
