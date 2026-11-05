import "server-only";
import { listVenueHours } from "@bibi/core";
import type { CalendarWindow } from "@bibi/ui";
import { loadVenues } from "@/server/load-venues";
import { runOperation } from "@/server/run-operation";

/** `venue.hoursList` takes at most this many ids per call. */
const CHUNK = 100;

function chunks({ ids }: { ids: string[] }): string[][] {
  return Array.from({ length: Math.ceil(ids.length / CHUNK) }, (_, index) =>
    ids.slice(index * CHUNK, (index + 1) * CHUNK),
  );
}

/**
 * The span every venue's weekly opening hours fit in (ADR 0064 rule 10): the earliest opening and
 * the latest closing of any weekday. `undefined` without venues, hours or `venue:read`, so the
 * calendar falls back to an office day. Advisory: bookings outside still widen it.
 */
export async function loadOpeningHours(): Promise<CalendarWindow | undefined> {
  const venues = await loadVenues();
  if (!venues.ok || venues.value.length === 0) return undefined;
  const results = await Promise.all(
    chunks({ ids: venues.value.map(({ id }) => id) }).map((venueIds) =>
      runOperation({ operation: listVenueHours, input: { venueIds } }),
    ),
  );
  const days = results.flatMap((result) =>
    result.ok ? result.value.items.flatMap(({ hours }) => hours.days) : [],
  );
  if (days.length === 0) return undefined;
  return {
    from: Math.min(...days.map((day) => day.startMinute)),
    to: Math.max(...days.map((day) => day.endMinute)),
  };
}
