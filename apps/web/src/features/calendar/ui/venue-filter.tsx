"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { SelectFilter } from "@/components/select-filter";

export type VenueFilterProps = {
  venues: { id: string; name: string }[];
  venueId: string | undefined;
  /** The current query without `venue`; the filter adds or drops it. */
  query: Record<string, string>;
};

/** Venue dropdown as URL state (a navigation filter: no server action, no toast). */
export function VenueFilter({ venues, venueId, query }: VenueFilterProps) {
  const t = useTranslations("calendar");
  const router = useRouter();
  const pathname = usePathname();
  return (
    <SelectFilter
      label={t("venue")}
      allLabel={t("allVenues")}
      value={venueId}
      options={venues.map(({ id, name }) => ({ value: id, label: name }))}
      onChange={(venue) => router.replace({ pathname, query: venue ? { ...query, venue } : query })}
    />
  );
}
