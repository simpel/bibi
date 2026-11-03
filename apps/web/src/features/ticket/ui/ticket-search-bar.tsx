import { getTranslations } from "next-intl/server";
import { buildQueryCatalog } from "@/components/query-search/lib/query-catalog";
import { PeopleQuickFilters } from "@/components/query-search/people-quick-filters";
import { QuerySearch } from "@/components/query-search/query-search";
import { ROUTES } from "@/lib/routes";
import type { loadTicketQuery } from "../load-ticket-query";

type Data = {
  statuses: { name: string }[];
  types: { name: string }[];
  contacts: { name: string }[];
  /** The caller may not view customers: no contact names (ADR 0071). */
  customersHidden: boolean;
};

export type TicketSearchBarProps = {
  q: string | undefined;
  query: Awaited<ReturnType<typeof loadTicketQuery>>;
  data: Data;
};

/** The quick filters and the search, with the names the search offers (statuses, types, contacts). */
export async function TicketSearchBar({ q, query, data }: TicketSearchBarProps) {
  const t = await getTranslations("ticket");
  const { vocabulary, texts } = query;
  const names = {
    status: data.statuses,
    type: data.types,
    contact: data.customersHidden ? [] : data.contacts,
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <PeopleQuickFilters pathname={ROUTES.tickets} q={q} vocabulary={vocabulary} />
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
