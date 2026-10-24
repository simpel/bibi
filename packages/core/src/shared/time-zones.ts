import type { OperationContext } from "../operations/types";
import { effectiveTimeZone } from "../time/time-zone";

type Db = { context: Pick<OperationContext, "db"> };

/** A record's venue (or none) → the zone its times show and are entered in (ADR 0064). */
export type ZoneOfVenue = (input: { venue: { timeZone: string | null } | null }) => string;

/**
 * The resolver bound to the organization's zone, read once. Operations put the result on their
 * own records (`timeZone`, derived), so a caller never needs `venue:read` to know which zone a
 * line's or an item's times are in.
 */
export async function loadZoneOfVenue({ context }: Db): Promise<ZoneOfVenue> {
  const organization = await context.db.organizationProfile.findFirst({
    select: { timeZone: true },
  });
  return ({ venue }) => effectiveTimeZone({ venue, organization });
}

export type VenueZonesInput = Db & { venueIds: readonly (string | null)[] };

/** `venueId` (or null) → its effective zone, for any number of venues in two queries. */
export async function loadVenueZones({ context, venueIds }: VenueZonesInput) {
  const ids = [...new Set(venueIds.flatMap((id) => (id ? [id] : [])))];
  const [zoneOf, venues] = await Promise.all([
    loadZoneOfVenue({ context }),
    ids.length === 0
      ? []
      : context.db.venue.findMany({
          where: { id: { in: ids }, status: { in: ["ACTIVE", "ARCHIVED"] } },
          select: { id: true, timeZone: true },
        }),
  ]);
  const own = new Map(venues.map((venue) => [venue.id, venue]));
  return ({ venueId }: { venueId: string | null }) =>
    zoneOf({ venue: venueId ? (own.get(venueId) ?? null) : null });
}
