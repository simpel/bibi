import {
  addDays,
  daysBetween,
  weekdayOf,
} from "../../components/availability-calendar/calendar-dates";
import type { AssetBooking } from "../../components/availability-calendar/calendar-types";
import { STORY_DAY } from "./story-dates";

/** A repeatable 0–1 from a string: the same day always gets the same bookings. */
function noise({ seed }: { seed: string }): number {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 10_000) / 10_000;
}

/** Another day's ticket number, so a ticket never spans two days in the story. */
function renumber({ ticket, offset }: { ticket: string | null; offset: number }) {
  const number = Number(ticket?.replace(/\D/g, ""));
  if (!ticket || Number.isNaN(number)) return ticket;
  return `Ticket ${((((offset * 60 + number) % 9000) + 9000) % 9000) + 1000}`;
}

/** One day made from the template: weekdays fairly full, weekends mostly free. */
function dayOf({ date, template }: { date: string; template: readonly AssetBooking[] }) {
  const offset = daysBetween({ from: STORY_DAY, to: date });
  if (offset === 0) return [...template];
  const weekend = weekdayOf({ date }) >= 5;
  const fill = weekend ? 0.12 : 0.35 + noise({ seed: date }) * 0.55;
  return template
    .filter((booking) => noise({ seed: `${date}/${booking.id}` }) < fill)
    .map((booking) => ({
      ...booking,
      id: `${booking.id}@${date}`,
      date,
      ticket: renumber({ ticket: booking.ticket, offset }),
    }));
}

/**
 * Bookings for any days, for stories that scroll forever: the story day is the template itself,
 * every other day a repeatable subset of it. A real build loads them with `calendar.range`.
 */
export function rangeBookings({
  from,
  to,
  template,
}: {
  from: string;
  to: string;
  template: readonly AssetBooking[];
}): AssetBooking[] {
  const days = daysBetween({ from, to }) + 1;
  return Array.from({ length: days }, (_, index) =>
    dayOf({ date: addDays({ date: from, days: index }), template }),
  ).flat();
}
