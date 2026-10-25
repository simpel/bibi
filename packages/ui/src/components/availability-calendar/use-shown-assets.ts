"use client";

import { useMemo, useState } from "react";
import { matches } from "./availability-filter";
import { useCalendarLabels } from "./calendar-labels";
import type { AssetBooking, CalendarAsset } from "./calendar-types";

/** The assets the group filter and the search leave, and what to say when they leave none. */
export function useShownAssets({
  assets,
  bookings,
}: {
  assets: readonly CalendarAsset[];
  bookings: readonly AssetBooking[];
}) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const labels = useCalendarLabels();
  const shown = useMemo(
    () =>
      assets.filter(
        (asset) =>
          (groups.length === 0 || groups.includes(asset.group)) &&
          matches({ asset, bookings, query }),
      ),
    [assets, bookings, groups, query],
  );
  const filter = { assets, query, groups, onQuery: setQuery, onGroups: setGroups };
  const empty = shown.length === 0 ? labels.noMatch({ query, groups }) : undefined;
  return { shown, filter, empty };
}
