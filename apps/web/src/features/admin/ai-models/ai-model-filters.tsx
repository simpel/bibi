"use client";

import { useTranslations } from "next-intl";
import { SearchForm } from "@/components/search-form";
import { useQueryNavigation } from "@/lib/use-query-navigation";

export type AiModelFiltersProps = { q: string | undefined };

/** Free-text search across AI features and models; state lives in the URL. */
export function AiModelFilters({ q }: AiModelFiltersProps) {
  const t = useTranslations("admin.aiModels.filters");
  const { navigate, pending } = useQueryNavigation();
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <SearchForm
        value={q}
        label={t("search")}
        submitLabel={t("searchSubmit")}
        pendingLabel={t("searching")}
        pending={pending}
        onSearch={(value) => navigate({ patch: { q: value } })}
      />
    </div>
  );
}
