"use client";

import { NOTIFICATION_KINDS, type NotificationKind } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { FilterSelect } from "@/components/filter-select";
import { SearchForm } from "@/components/search-form";
import { useQueryNavigation } from "@/lib/use-query-navigation";

export type NotificationFiltersProps = {
  q: string | undefined;
  kind: NotificationKind | undefined;
};

/** Search on the order and a kind filter, both kept in the URL (a navigation form, no action). */
export function NotificationFilters({ q, kind }: NotificationFiltersProps) {
  const t = useTranslations("notifications");
  const { navigate, pending } = useQueryNavigation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchForm
        value={q}
        label={t("search")}
        submitLabel={t("searchSubmit")}
        pendingLabel={t("searching")}
        pending={pending}
        onSearch={(value) => navigate({ patch: { q: value } })}
      />
      <FilterSelect
        className="w-44"
        label={t("filter.kind")}
        allLabel={t("filter.allKinds")}
        value={kind}
        options={NOTIFICATION_KINDS.map((value) => ({ value, label: t(`kinds.${value}`) }))}
        onChange={(value) => navigate({ patch: { kind: value } })}
      />
    </div>
  );
}
