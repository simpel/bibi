"use client";

import { TriangleAlertIcon } from "lucide-react";
import { BookingDetails } from "./booking-details";
import { useCalendarLabels } from "./calendar-labels";
import { toMinutes } from "./calendar-time";
import type { AssetBooking, CalendarWindow } from "./calendar-types";

export type ClashCardsProps = {
  /** Every booking in the clash, the one pointed at among them. */
  bookings: readonly AssetBooking[];
  /** The time they share. */
  stretch: CalendarWindow;
  onOpen?: ((booking: AssetBooking) => void) | undefined;
};

const rankOf = ({ booking }: { booking: AssetBooking }) => (booking.state.hold === "hard" ? 0 : 1);

/**
 * Hard holds first: a hard hold wins and the soft holds it overlaps are blocked. The rest have
 * no rank (ADR 0044) and go by start until "held since" reaches the calendar.
 */
function inOrder({ bookings }: Pick<ClashCardsProps, "bookings">) {
  return [...bookings].sort(
    (a, b) =>
      rankOf({ booking: a }) - rankOf({ booking: b }) ||
      toMinutes({ time: a.start }) - toMinutes({ time: b.start }),
  );
}

/**
 * A clash in one card: the shared time in red on top, then each booking's card, the same for all.
 * Bookings in a clash are equals; who gets the time is a human decision.
 */
export function ClashCards({ bookings, stretch, onOpen }: ClashCardsProps) {
  const labels = useCalendarLabels();
  return (
    <div className="grid">
      <p className="-mx-3 -mt-3 mb-3 flex items-center gap-1.5 rounded-t-md border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive tabular-nums">
        <TriangleAlertIcon aria-hidden className="size-3.5 shrink-0" />
        {labels.clash({
          from: labels.clock({ minutes: stretch.from }),
          to: labels.clock({ minutes: stretch.to }),
        })}
      </p>
      <div className="grid gap-3 divide-y *:pb-3 *:last:pb-0">
        {inOrder({ bookings }).map((booking) => (
          <BookingDetails
            key={booking.id}
            booking={booking}
            onOpen={onOpen ? () => onOpen(booking) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
