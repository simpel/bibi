import { ok } from "../../errors/result";
import { VenueHoursGetInputSchema, VenueHoursSetInputSchema } from "../../hours/owner-schema";
import { HoursSchema } from "../../hours/schema";
import { loadHours, replaceHours } from "../../hours/store";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { loadZoneOfVenue } from "../../shared/time-zones";

type ZoneInput = { context: Pick<OperationContext, "db">; venueId: string };

/** The active venue's effective zone, or null when there is no such venue. */
async function venueZone({ context, venueId }: ZoneInput) {
  const [venue, zoneOf] = await Promise.all([
    context.db.venue.findFirst({ where: { id: venueId }, select: { timeZone: true } }),
    loadZoneOfVenue({ context }),
  ]);
  return venue ? zoneOf({ venue }) : null;
}

export const getVenueHours = defineOperation({
  name: "venueHours.get",
  kind: "query",
  description:
    "Read a venue's opening hours (ADR 0064): a weekly pattern (weekday 0 = Monday, start, end " +
    "and optional break in minutes after midnight; a missing weekday is closed) plus dated " +
    "exceptions (closed, or other hours), read in the venue's zone. Advisory only.",
  input: VenueHoursGetInputSchema,
  output: HoursSchema,
  permission: "venue:read",
  entityType: "venue",
  handler: async ({ input: { venueId }, context }) => {
    const timeZone = await venueZone({ context, venueId });
    if (!timeZone) return notFound({ entity: "Venue" });
    return ok({ value: await loadHours({ context, owner: { venueId }, timeZone }) });
  },
});

export const setVenueHours = defineOperation({
  name: "venueHours.set",
  kind: "command",
  description:
    "Replace a venue's opening hours with `days` (each weekday at most once) and `exceptions` " +
    "(each date at most once; no times = closed). Minutes after midnight in the venue's zone. " +
    "Hours only warn: booking outside them stays allowed.",
  input: VenueHoursSetInputSchema,
  output: HoursSchema,
  permission: "venue:write",
  entityType: "venue",
  handler: async ({ input: { venueId, ...pattern }, context }) => {
    const timeZone = await venueZone({ context, venueId });
    if (!timeZone) return notFound({ entity: "Venue" });
    const owner = { venueId };
    const before = await loadHours({ context, owner, timeZone });
    const after = await replaceHours({ context, owner, timeZone, pattern });
    context.recordChange({ entityId: venueId, before: { hours: before }, after: { hours: after } });
    return ok({ value: after });
  },
});

/** Venue opening hours (ADR 0064 rule 10). */
export const venueHoursOperations = [getVenueHours, setVenueHours];
