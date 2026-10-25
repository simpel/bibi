import { toMinutes } from "./calendar-time";
import type { AssetBooking, CalendarState, CalendarWindow } from "./calendar-types";
import { clashesOf } from "./clashes";

export type DayOccupancy = {
  /** Booked share of the open hours, 0–1; overlapping bookings count once. */
  share: number;
  /** The state that covers the most booked time: the cell's colour. */
  state: CalendarState | null;
  clash: boolean;
  count: number;
};

const spanOf = ({ booking, hours }: { booking: AssetBooking; hours: CalendarWindow }) => ({
  from: Math.max(toMinutes({ time: booking.start }), hours.from),
  to: Math.min(toMinutes({ time: booking.end }), hours.to),
});

function bookedMinutes({ spans }: { spans: readonly CalendarWindow[] }): number {
  let total = 0;
  let reach = Number.NEGATIVE_INFINITY;
  for (const span of [...spans].sort((a, b) => a.from - b.from)) {
    const from = Math.max(span.from, reach);
    if (span.to > from) total += span.to - from;
    reach = Math.max(reach, span.to);
  }
  return total;
}

function dominantState({
  bookings,
  hours,
}: {
  bookings: readonly AssetBooking[];
  hours: CalendarWindow;
}): CalendarState | null {
  const minutes = new Map<CalendarState, number>();
  for (const booking of bookings) {
    const { from, to } = spanOf({ booking, hours });
    minutes.set(booking.state, (minutes.get(booking.state) ?? 0) + Math.max(0, to - from));
  }
  const ranked = [...minutes].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? null;
}

/** One asset's day in a number: how full, mostly in which state, and whether anything clashes. */
export function occupancyOf({
  bookings,
  hours,
}: {
  bookings: readonly AssetBooking[];
  hours: CalendarWindow;
}): DayOccupancy {
  const spans = bookings.map((booking) => spanOf({ booking, hours }));
  return {
    share: bookedMinutes({ spans }) / (hours.to - hours.from),
    state: dominantState({ bookings, hours }),
    clash: clashesOf({ lines: bookings }).length > 0,
    count: bookings.length,
  };
}

/** Bookings grouped by their day key, for a row or the overview strip. */
export function byDate({ bookings }: { bookings: readonly AssetBooking[] }) {
  const days = new Map<string, AssetBooking[]>();
  for (const booking of bookings) {
    days.set(booking.date, [...(days.get(booking.date) ?? []), booking]);
  }
  return days;
}
