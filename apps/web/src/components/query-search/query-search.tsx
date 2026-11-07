"use client";

import { useTranslations } from "next-intl";
import type { TableQueryKeys } from "@/components/data-table/table-query-keys";
import { SearchForm } from "@/components/search-form";
import { usePendingToast } from "@/lib/use-pending-toast";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import type { QueryCatalog, QueryTexts } from "./lib/query-suggestion-types";
import type { QueryVocabulary } from "./lib/query-vocabulary";
import { QueryInput } from "./query-input";

export type QuerySearchProps = {
  value: string | undefined;
  /** Placeholder and accessible name of the field, and of its button. */
  label: string;
  submitLabel: string;
  catalog: QueryCatalog;
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
  className?: string;
  /** URL keys of the search and its page; a second table on a page gets its own (`useClientTableView` `scope`). */
  keys?: TableQueryKeys;
};

/**
 * A list's search and GitHub-style filters (`assignee:me status:Lead`), with suggestions while
 * typing; a new search starts on page 1, with a loading toast until its page is there.
 */
export function QuerySearch({ value, label, submitLabel, keys, ...query }: QuerySearchProps) {
  const common = useTranslations("common");
  const { navigate, pending } = useQueryNavigation();
  usePendingToast({ pending, message: common("searching") });
  return (
    <SearchForm
      value={value}
      label={label}
      submitLabel={submitLabel}
      onSearch={(q) =>
        navigate({ patch: { [keys?.q ?? "q"]: q }, ...(keys ? { pageKey: keys.page } : {}) })
      }
      pending={pending}
      pendingLabel={common("searching")}
      className={query.className}
      renderInput={(field) => <QueryInput {...field} {...query} />}
    />
  );
}
