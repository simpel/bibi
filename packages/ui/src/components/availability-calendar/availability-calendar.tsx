"use client";

import { useEffect, useMemo } from "react";
import { cn } from "../../lib/cn";
import {
  type AvailabilityCalendarLayout,
  availabilityCalendarVariants,
  availabilityGridVariants,
} from "./availability-calendar-variants";
import { AvailabilityGrid, type AvailabilityGridProps } from "./availability-grid";
import { type FormatDate, formatDays } from "./calendar-dates";
import { type CalendarLabels, CalendarLabelsProvider } from "./calendar-labels";
import { CalendarToolbar } from "./calendar-toolbar";
import type { AssetBooking, CalendarAsset, CalendarWindow } from "./calendar-types";
import { byDate, occupancyOf } from "./day-occupancy";
import { type CalendarDayValue, dayTotals } from "./day-value";
import { OverviewStrip } from "./overview-strip";
import { PinScope } from "./pin-scope";
import { frameOf } from "./timeline-frame";
import { floorDayPx } from "./timeline-scale";
import { useDayWindow } from "./use-day-window";
import { useRangeControls } from "./use-range-controls";
import { useShownAssets } from "./use-shown-assets";
import { type UseTimelineInput, useTimeline } from "./use-timeline";

export type AvailabilityCalendarProps = Pick<
  AvailabilityGridProps,
  "selectedId" | "onAdd" | "onOpen"
> & {
  assets: readonly CalendarAsset[];
  /** Bookings on any loaded day; load more on `onRangeChange`. */
  bookings: readonly AssetBooking[];
  /** The venue's today, a day key. */
  today: string;
  locale: string;
  /** The user's date formatter (`useDateTimeFormat().date` in the app). */
  formatDate: FormatDate;
  labels: CalendarLabels;
  onRangeChange?: UseTimelineInput["onRangeChange"];
  initialLevel?: UseTimelineInput["initialLevel"];
  initialRange?: UseTimelineInput["initialRange"];
  /** The venues' opening hours, widest across the week (ADR 0064); bookings outside widen it. */
  openingHours?: CalendarWindow;
  /** What each asset's loaded days are worth; the day headings sum the assets shown. */
  values?: readonly CalendarDayValue[];
  className?: string;
  /** The days on screen changed, e.g. to keep them in the URL; `to` is inclusive. */
  onShownChange?: (range: { from: string; to: string }) => void;
} & AvailabilityCalendarLayout;

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

/** Tells `onShownChange` once the days on screen settle on new ones. */
function useShownChange({
  shown,
  onShownChange,
}: {
  shown: { from: string; to: string };
  onShownChange: AvailabilityCalendarProps["onShownChange"];
}) {
  const { from, to } = shown;
  useEffect(() => {
    if (!onShownChange) return;
    const timer = setTimeout(() => onShownChange({ from, to }), 400);
    return () => clearTimeout(timer);
  }, [from, to, onShownChange]);
}

/**
 * The main calendar: what is free and what is taken, for every asset the organization books, on
 * one timeline from a single day to months. Pick a range or pinch; scroll on forever either way.
 * Pin bookings from their cards to compare them side by side at the bottom.
 */
export function AvailabilityCalendar({ labels, ...props }: AvailabilityCalendarProps) {
  const { assets, formatDate, onOpen } = props;
  return (
    <CalendarLabelsProvider labels={labels}>
      <PinScope {...{ labels, assets, formatDate, onOpen }}>
        <Calendar {...props} />
      </PinScope>
    </CalendarLabelsProvider>
  );
}

function Calendar(props: Omit<AvailabilityCalendarProps, "labels">) {
  const { assets, today, locale, formatDate, openingHours, values, ...rest } = props;
  const { onRangeChange, initialLevel, initialRange, onShownChange, layout, className, ...row } =
    rest;
  const { shown, filter, empty } = useShownAssets({ assets, bookings: props.bookings });
  const { hours, bookings } = useDayWindow({ bookings: props.bookings, openingHours });
  const timeline = useTimeline({ today, hours, initialLevel, initialRange, onRangeChange });
  const controls = useRangeControls({ timeline, hours, today });
  useShownChange({ shown: controls.shown, onShownChange });
  const density = useMemo(
    () => densityOf({ assets: shown, bookings, hours }),
    [shown, bookings, hours],
  );
  const totals = useMemo(
    () => values && dayTotals({ values, assetIds: new Set(shown.map((asset) => asset.id)) }),
    [values, shown],
  );
  const onDrill = ({ date }: { date: string }) =>
    timeline.jump({ date, days: 1, floor: floorDayPx({ level: "day", hours }) });
  const label = formatDays({ ...controls.shown, format: formatDate });
  const frame = frameOf({ timeline, hours, today, locale, formatDate, onDrill });
  return (
    <div className={cn(availabilityCalendarVariants({ layout }), className)}>
      <CalendarToolbar range={{ ...controls, label }} filter={filter} />
      <OverviewStrip
        {...{ view: timeline.view, scroll: timeline.scroll, trackPx: timeline.trackPx }}
        {...{ density, today, locale, shownLabel: label }}
        onScrollTo={(left) => timeline.scrollerRef.current?.scrollTo({ left })}
      />
      <AvailabilityGrid
        {...{ bookings, timeline, frame, empty, totals }}
        assets={shown}
        className={availabilityGridVariants({ layout })}
        {...row}
      />
    </div>
  );
}
