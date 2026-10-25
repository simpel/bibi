"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "../../components/availability-calendar/availability-calendar";
import { BookingSheet } from "../../components/availability-calendar/booking-sheet";
import type {
  AssetBooking,
  CalendarAsset,
} from "../../components/availability-calendar/calendar-types";
import { STORY_CALENDAR } from "./story-labels";
import { ticketOf } from "./ticket-of";
import { useStoryBookings } from "./use-story-bookings";

export type AvailabilityWithTicketProps = {
  assets: readonly CalendarAsset[];
  /** The story day's bookings; other days are made from them as they load. */
  template: readonly AssetBooking[];
};

/**
 * Overview to detail: availability is the overview, and a booking opens its ticket's Program in
 * a sheet. The booking stays ringed behind it, so closing returns to the same place.
 */
export function AvailabilityWithTicket({ assets, template }: AvailabilityWithTicketProps) {
  const { bookings, onRangeChange } = useStoryBookings({ template });
  const [open, setOpen] = useState<AssetBooking | null>(null);
  const [added, setAdded] = useState("");
  const ticket = open ? ticketOf({ booking: open, bookings, assets }) : null;
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
      <BookingSheet ticket={ticket} locale="en-GB" onClose={() => setOpen(null)} />
    </div>
  );
}
