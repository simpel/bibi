"use client";

import { useMemo, useState } from "react";
import { matches } from "./availability-filter";
import { AvailabilityGrid, type AvailabilityGridProps } from "./availability-grid";
import { type FormatDate, formatDays, STORY_DAY, storyFormatDate } from "./calendar-dates";
import { CalendarToolbar } from "./calendar-toolbar";
import type { AssetBooking, CalendarAsset, CalendarWindow } from "./calendar-types";
import { byDate, occupancyOf } from "./day-occupancy";
import { OverviewStrip } from "./overview-strip";
import { frameOf } from "./timeline-frame";
import { floorDayPx, openHours } from "./timeline-scale";
import { useRangeControls } from "./use-range-controls";
import { type UseTimelineInput, useTimeline } from "./use-timeline";

export type AvailabilityCalendarProps = Pick<
  AvailabilityGridProps,
  "selectedId" | "onAdd" | "onOpen"
> & {
  assets: readonly CalendarAsset[];
  /** Bookings on any loaded day; load more on `onRangeChange`. */
  bookings: readonly AssetBooking[];
  /** The venue's today, a day key. */
  today?: string;
  locale?: string;
  /** The user's date formatter (`useDateTimeFormat().date` in the app); default `D_MMM_YYYY`. */
  formatDate?: FormatDate;
  onRangeChange?: UseTimelineInput["onRangeChange"];
  initialLevel?: UseTimelineInput["initialLevel"];
};

/** How full each day is across the assets shown, for the overview strip. */
function densityOf({
  assets,
  bookings,
  hours,
}: {
  assets: readonly CalendarAsset[];
  bookings: readonly AssetBooking[];
  hours: CalendarWindow;
}) {
  const ids = new Set(assets.map((asset) => asset.id));
  const density = new Map<string, number>();
  for (const [date, day] of byDate({ bookings: bookings.filter((b) => ids.has(b.assetId)) })) {
    const total = [...ids].reduce((sum, id) => {
      const own = day.filter((booking) => booking.assetId === id);
      return sum + (own.length > 0 ? occupancyOf({ bookings: own, hours }).share : 0);
    }, 0);
    density.set(date, total / Math.max(1, ids.size));
  }
  return density;
}

function useShownAssets({
  assets,
  bookings,
}: Pick<AvailabilityCalendarProps, "assets" | "bookings">) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
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
  const empty =
    shown.length === 0
      ? `Nothing matches “${query}”${groups.length === 0 ? "" : ` in ${groups.join(", ")}`}.`
      : undefined;
  return { shown, filter, empty };
}

/**
 * The main calendar: what is free and what is taken, for every asset the organization books, on
 * one timeline from a single day to months. Pick a range or pinch; scroll on forever either way.
 */
export function AvailabilityCalendar(props: AvailabilityCalendarProps) {
  const { assets, bookings, today = STORY_DAY, locale = "en-GB", ...rest } = props;
  const { onRangeChange, initialLevel, formatDate = storyFormatDate({ locale }), ...row } = rest;
  const { shown, filter, empty } = useShownAssets({ assets, bookings });
  const hours = useMemo(() => openHours({ bookings }), [bookings]);
  const timeline = useTimeline({ today, hours, initialLevel, onRangeChange });
  const controls = useRangeControls({ timeline, hours, today });
  const density = useMemo(
    () => densityOf({ assets: shown, bookings, hours }),
    [shown, bookings, hours],
  );
  const onDrill = ({ date }: { date: string }) =>
    timeline.jump({ date, days: 1, floor: floorDayPx({ level: "day", hours }) });
  const label = formatDays({ ...controls.shown, format: formatDate });
  const frame = frameOf({ timeline, hours, today, locale, formatDate, onDrill });
  return (
    <div className="@container grid min-w-0 gap-3 rounded-xl border bg-card p-3 shadow-xs sm:gap-4 sm:p-5">
      <CalendarToolbar range={{ ...controls, label }} filter={filter} />
      <OverviewStrip
        view={timeline.view}
        scroll={timeline.scroll}
        trackPx={timeline.trackPx}
        density={density}
        today={today}
        locale={locale}
        shownLabel={label}
        onScrollTo={(left) => timeline.scrollerRef.current?.scrollTo({ left })}
      />
      <AvailabilityGrid
        assets={shown}
        bookings={bookings}
        timeline={timeline}
        frame={frame}
        empty={empty}
        {...row}
      />
    </div>
  );
}
