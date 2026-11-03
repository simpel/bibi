"use client";

import { INBOUND_CHANNELS, type InboundChannel } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { FilterSelect } from "@/components/filter-select";
import { SearchForm } from "@/components/search-form";
import { useQueryNavigation } from "@/lib/use-query-navigation";

export type InboxFiltersProps = { q: string | undefined; channel: InboundChannel | undefined };

/** Search on subject and sender and a channel filter, in the URL: the same as notifications. */
export function InboxFilters({ q, channel }: InboxFiltersProps) {
  const t = useTranslations("inbox");
  const { navigate, pending } = useQueryNavigation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchForm
        value={q}
        label={t("search")}
        submitLabel={t("searchSubmit")}
        pendingLabel={t("searching")}
        pending={pending}
        onSearch={(value) => navigate({ patch: { q: value, cursor: null } })}
      />
      <FilterSelect
        className="w-44"
        label={t("filter.channel")}
        allLabel={t("filter.allChannels")}
        value={channel}
        options={INBOUND_CHANNELS.map((value) => ({ value, label: t(`channels.${value}`) }))}
        onChange={(value) => navigate({ patch: { channel: value, cursor: null } })}
      />
    </div>
  );
}
