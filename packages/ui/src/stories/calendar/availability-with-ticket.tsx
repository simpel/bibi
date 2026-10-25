"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "../../components/availability-calendar/availability-calendar";
import type {
  AssetBooking,
  CalendarAsset,
  CalendarTicket,
} from "../../components/availability-calendar/calendar-types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/sheet/sheet";
import { STORY_CALENDAR } from "./story-labels";
import { TicketLanes } from "./ticket-lanes";
import { ticketOf } from "./ticket-of";
import { useStoryBookings } from "./use-story-bookings";

export type AvailabilityWithTicketProps = {
  assets: readonly CalendarAsset[];
  /** The story day's bookings; other days are made from them as they load. */
  template: readonly AssetBooking[];
};

/** The ticket's Program beside the calendar. */
function TicketSheet({ ticket, onClose }: { ticket: CalendarTicket | null; onClose: () => void }) {
  return (
    <Sheet open={Boolean(ticket)} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-3xl"
        // Focus the sheet, not its first block: a focused block would pop its hover card.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{ticket?.reference}</SheetTitle>
          <SheetDescription>{ticket?.customer}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {ticket ? <TicketLanes ticket={ticket} audience="internal" locale="en-GB" /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

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
      <TicketSheet ticket={ticket} onClose={() => setOpen(null)} />
    </div>
  );
}
