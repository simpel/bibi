import { getTranslations } from "next-intl/server";
import { buildQueryCatalog } from "@/components/query-search/lib/query-catalog";
import { QuerySearch } from "@/components/query-search/query-search";
import { PEOPLE_VIEWS } from "@/components/saved-views/lib/saved-views";
import { SavedViews } from "@/components/saved-views/saved-views";
import { ROUTES } from "@/lib/routes";
import type { RunSheetListData } from "../load-run-sheet-list-data";
import type { loadRunSheetQuery } from "../load-run-sheet-query";

export type RunSheetSearchBarProps = {
  /** The search in effect: the URL's, else the default. */
  q: string;
  query: Awaited<ReturnType<typeof loadRunSheetQuery>>;
  data: RunSheetListData;
};

/** The member's views and the search, with the names the search offers. */
export async function RunSheetSearchBar({ q, query, data }: RunSheetSearchBarProps) {
  const t = await getTranslations("runSheet.list");
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
      <SavedViews
        listId="run-sheets"
        defaults={PEOPLE_VIEWS}
        pathname={ROUTES.runSheets}
        q={q}
        vocabulary={vocabulary}
      />
      <QuerySearch
        value={q}
        label={t("search")}
        submitLabel={t("searchSubmit")}
        vocabulary={vocabulary}
        texts={texts}
        catalog={buildQueryCatalog({ names, vocabulary })}
        className="sm:ml-auto"
      />
    </div>
  );
}
