"use client";

import {
  type AssetBooking,
  AvailabilityCalendar,
  CalendarLabelsProvider,
  CalendarLegend,
  type CalendarState,
} from "@bibi/ui";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { CalendarDays } from "../actions";
import { SlotSheet } from "./slot-sheet";
import { useCalendarText } from "./use-calendar-text";
import { useLoadedBookings } from "./use-loaded-bookings";

export type ReadOnlyCalendarProps = {
  /** The first load: rows, the days' bookings, today and the opening hours. */
  days: CalendarDays;
  /** The days it opens on. */
  range: { from: string; to: string };
  /** Bookings drawn over the loaded ones, e.g. an intake's draft lines; never saved. */
  overlay?: readonly AssetBooking[];
};

/** Without `href` a booking's card offers no way off the calendar (read-only stays put). */
const stayPut = ({ bookings }: { bookings: readonly AssetBooking[] }) =>
  bookings.map(({ href: _href, ...booking }) => booking);

/** The states on screen once each, for the legend. */
const statesOf = ({ bookings }: { bookings: readonly AssetBooking[] }) => {
  const states = new Map<string, CalendarState>();
  for (const { state } of bookings) states.set(`${state.name}:${state.color}`, state);
  return [...states.values()];
};

/**
 * The availability calendar to look at, not to change: no adding, no moving, no leaving the
 * page. More days load as it scrolls; a booking opens its slot in a sheet over it.
 */
export function ReadOnlyCalendar({ days, range, overlay = [] }: ReadOnlyCalendarProps) {
  const labels = useCalendarText();
  const locale = useLocale();
  const format = useDateTimeFormat();
  const loaded = useLoadedBookings({ initial: days, range });
  const bookings = useMemo(
    () => stayPut({ bookings: [...loaded.bookings, ...overlay] }),
    [loaded.bookings, overlay],
  );
  const states = useMemo(() => statesOf({ bookings }), [bookings]);
  const [slot, setSlot] = useState<AssetBooking | null>(null);
  const hours = days.openingHours ? { openingHours: days.openingHours } : {};
  return (
    <CalendarLabelsProvider labels={labels}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AvailabilityCalendar
          {...{ assets: days.assets, bookings, values: loaded.values, today: days.today }}
          {...{ locale, labels, onRangeChange: loaded.onRangeChange, ...hours }}
          layout="page"
          className="isolate min-h-0 flex-1"
          formatDate={format.date}
          initialRange={range}
          initialLevel="day"
          selectedId={slot?.id}
          onOpen={setSlot}
        />
        <div className="shrink-0 border-t px-4 py-2.5">
          <CalendarLegend states={states} />
        </div>
        <SlotSheet slot={slot} assets={days.assets} onClose={() => setSlot(null)} />
      </div>
    </CalendarLabelsProvider>
  );
}
