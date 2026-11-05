"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "../../components/availability-calendar/availability-calendar";
import { BookingSheet } from "../../components/availability-calendar/booking-sheet";
import type {
  AssetBooking,
  CalendarAsset,
} from "../../components/availability-calendar/calendar-types";
import { orderOf } from "./order-of";
import { STORY_CALENDAR } from "./story-labels";
import { useStoryBookings } from "./use-story-bookings";

export type AvailabilityWithOrderProps = {
  assets: readonly CalendarAsset[];
  /** The story day's bookings; other days are made from them as they load. */
  template: readonly AssetBooking[];
};

/**
 * Overview to detail: availability is the overview, and a booking opens its order's Program in
 * a sheet. The booking stays ringed behind it, so closing returns to the same place.
 */
export function AvailabilityWithOrder({ assets, template }: AvailabilityWithOrderProps) {
  const { bookings, onRangeChange } = useStoryBookings({ template });
  const [open, setOpen] = useState<AssetBooking | null>(null);
  const [added, setAdded] = useState("");
  const order = open ? orderOf({ booking: open, bookings, assets }) : null;
  return (
    <div className="grid gap-3">
      <AvailabilityCalendar
        {...STORY_CALENDAR}
        assets={assets}
        bookings={bookings}
        onRangeChange={onRangeChange}
        selectedId={open?.id}
        onOpen={setOpen}
        onAdd={({ asset, date, start, end }) =>
          setAdded(`New booking on ${asset.name}, ${date} ${start}–${end}`)
        }
      />
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {added}
      </p>
      <BookingSheet order={order} locale="en-GB" onClose={() => setOpen(null)} />
    </div>
  );
}
