import { footprint, formatMinutes, toMinutes } from "./calendar-time";
import type { AssetBooking, CalendarWindow } from "./calendar-types";

/** Without opening hours: an office day, so an empty calendar still has a shape. */
const OFFICE: CalendarWindow = { from: 8 * 60, to: 18 * 60 };

/** Where a line over midnight was cut: its own start and end lie on the days around it. */
const CUT_START = "00:00";
const CUT_END = "24:00";

/**
 * The window every day shares, so columns line up: the opening hours, widened to whole hours by
 * any booking outside them (hours are advisory, ADR 0064). A line over midnight widens it by its
 * real start and end only, never by the midnight it was cut at, so one late night does not turn
 * every day into 00–24.
 */
export function openHours({
  bookings,
  base = OFFICE,
}: {
  bookings: readonly AssetBooking[];
  base?: CalendarWindow;
}): CalendarWindow {
  let { from, to } = base;
  for (const booking of bookings) {
    const span = footprint({ line: booking, audience: "internal" });
    if (booking.start !== CUT_START) from = Math.min(from, span.from);
    if (booking.end !== CUT_END) to = Math.max(to, span.to);
  }
  return {
    from: Math.max(0, Math.floor(from / 60) * 60),
    to: Math.min(1440, Math.ceil(to / 60) * 60),
  };
}

/** The bookings as they fit the window: cut to it, and left out when wholly outside it. */
export function clipToWindow({
  bookings,
  window,
}: {
  bookings: readonly AssetBooking[];
  window: CalendarWindow;
}): AssetBooking[] {
  return bookings.flatMap((booking) => {
    const start = Math.max(toMinutes({ time: booking.start }), window.from);
    const end = Math.min(toMinutes({ time: booking.end }), window.to);
    if (end <= start) return [];
    const clipped =
      start !== toMinutes({ time: booking.start }) || end !== toMinutes({ time: booking.end });
    return clipped
      ? [
          {
            ...booking,
            start: formatMinutes({ minutes: start }),
            end: formatMinutes({ minutes: end }),
          },
        ]
      : [booking];
  });
}
