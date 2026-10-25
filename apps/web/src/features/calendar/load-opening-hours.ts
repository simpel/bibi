import "server-only";
import { getVenueHours, listVenues } from "@bibi/core";
import type { CalendarWindow } from "@bibi/ui";
import { listAll } from "@/server/list-all";
import { runOperation } from "@/server/run-operation";

/**
 * The span every venue's weekly opening hours fit in (ADR 0064 rule 10): the earliest opening and
 * the latest closing of any weekday. `undefined` without venues, hours or `venue:read`, so the
 * calendar falls back to an office day. Advisory: bookings outside still widen it.
 */
export async function loadOpeningHours(): Promise<CalendarWindow | undefined> {
  const venues = await listAll({ operation: listVenues, input: {} });
  if (!venues.ok) return undefined;
  const hours = await Promise.all(
    venues.value.map(({ id }) =>
      runOperation({ operation: getVenueHours, input: { venueId: id } }),
    ),
  );
  const days = hours.flatMap((result) => (result.ok ? result.value.days : []));
  if (days.length === 0) return undefined;
  return {
    from: Math.min(...days.map((day) => day.startMinute)),
    to: Math.max(...days.map((day) => day.endMinute)),
  };
}
