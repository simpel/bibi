import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { addDays, compareDates, type PlainDate, parseIsoDate } from "../../time/plain-date";
import { fromZonedParts } from "../../time/zoned-time";
import { type CalendarRangeInput, MAX_CALENDAR_DAYS } from "./schema";

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };
const DAY_MS = 86_400_000;

export type ResolvedRange = { timeZone: string; from: Date; to: Date };

type Context = Pick<OperationContext, "db">;

/**
 * The filtered venue's zone, else the organization's; a venue out of reach is NOT_FOUND. An
 * archived venue keeps its calendar (its past holds), as in `loadVenueZones`.
 */
async function zoneFor({ context, venueId }: { context: Context; venueId: string | undefined }) {
  const zoneOf = await loadZoneOfVenue({ context });
  if (!venueId) return ok({ value: zoneOf({ venue: null }) });
  const venue = await context.db.venue.findFirst({
    where: { id: venueId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { timeZone: true },
  });
  return venue ? ok({ value: zoneOf({ venue }) }) : notFound({ entity: "Venue" });
}

/** `from` on or before `to`, and the span within the cap. */
function checkSpan({ from, to }: { from: PlainDate; to: PlainDate }) {
  const days = compareDates({ a: to, b: from }) / DAY_MS + 1;
  if (days < 1) {
    return invalid({
      message: "from is after to",
      issues: [{ path: "to", message: "Must be on or after from" }],
    });
  }
  if (days > MAX_CALENDAR_DAYS) {
    const message = `At most ${MAX_CALENDAR_DAYS} days`;
    return invalid({ message, issues: [{ path: "to", message }] });
  }
  return ok({ value: undefined });
}

export type ResolveRangeInput = { context: Context; input: CalendarRangeInput };

/**
 * The days as instants (ADR 0064 decisions 2, 4 and 8): `[start of from, start of to + 1 day)`
 * in the venue's zone, else the organization's, so a day can be 23 or 25 hours long.
 */
export async function resolveRange({
  context,
  input,
}: ResolveRangeInput): Promise<Result<ResolvedRange>> {
  const from = parseIsoDate({ value: input.from });
  const to = parseIsoDate({ value: input.to });
  const span = checkSpan({ from, to });
  if (!span.ok) return span;
  const zone = await zoneFor({ context, venueId: input.venueId });
  if (!zone.ok) return err({ error: zone.error });
  const timeZone = zone.value;
  const start = fromZonedParts({ date: from, time: MIDNIGHT, timeZone });
  const end = fromZonedParts({ date: addDays({ date: to, days: 1 }), time: MIDNIGHT, timeZone });
  return ok({ value: { timeZone, from: start, to: end } });
}
