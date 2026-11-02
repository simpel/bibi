"use client";

import { useTranslations } from "next-intl";
import { SearchForm } from "@/components/search-form";
import { usePendingToast } from "@/lib/use-pending-toast";
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
 * new search starts on page 1, with a loading toast until its page is there.
 */
export function TicketSearch({ value, catalog, vocabulary }: TicketSearchProps) {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const { navigate, pending } = useQueryNavigation();
  usePendingToast({ pending, message: common("searching") });
  return (
    <SearchForm
      value={value}
      label={t("search")}
      submitLabel={t("searchSubmit")}
      onSearch={(q) => navigate({ patch: { q } })}
      pending={pending}
      pendingLabel={common("searching")}
      renderInput={(field) => (
        <TicketQueryInput {...field} catalog={catalog} vocabulary={vocabulary} />
      )}
    />
  );
}
