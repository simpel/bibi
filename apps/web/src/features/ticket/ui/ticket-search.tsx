"use client";

import { useTranslations } from "next-intl";
import { SearchForm } from "@/components/search-form";
import { useQueryNavigation } from "@/lib/use-query-navigation";

/** Search over reference, customer, contact and note; a new search starts on page 1. */
export function TicketSearch({ value }: { value: string | undefined }) {
  const t = useTranslations("ticket");
  const { navigate } = useQueryNavigation();
  return (
    <SearchForm
      value={value}
      label={t("search")}
      submitLabel={t("searchSubmit")}
      onSearch={(q) => navigate({ patch: { q } })}
    />
  );
}
