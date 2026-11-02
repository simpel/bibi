"use client";

import { useTranslations } from "next-intl";
import { SearchForm } from "@/components/search-form";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import type { QueryCatalog } from "../lib/query-suggestion-types";
import type { QueryVocabulary } from "../lib/query-vocabulary";
import { TicketQueryInput } from "./ticket-query-input";

export type TicketSearchProps = {
  value: string | undefined;
  catalog: QueryCatalog;
  vocabulary: QueryVocabulary;
};

/**
 * Search and GitHub-style filters (`assignee:me status:Lead`), with suggestions while typing; a
 * new search starts on page 1.
 */
export function TicketSearch({ value, catalog, vocabulary }: TicketSearchProps) {
  const t = useTranslations("ticket");
  const { navigate } = useQueryNavigation();
  return (
    <SearchForm
      value={value}
      label={t("search")}
      submitLabel={t("searchSubmit")}
      onSearch={(q) => navigate({ patch: { q } })}
      renderInput={(field) => (
        <TicketQueryInput {...field} catalog={catalog} vocabulary={vocabulary} />
      )}
    />
  );
}
