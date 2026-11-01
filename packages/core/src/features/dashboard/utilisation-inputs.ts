import { loadHoursLookups } from "../../hours/load-lookups";
import type { HoursLookup, Interval } from "../../hours/within-hours";
import { openIntervals } from "../../hours/within-hours";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { parseIsoDate } from "../../time/plain-date";
import { daysOf, OFFICE_HOURS } from "../calendar/load-values";
import type { DashboardWindow } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

export type UtilisedItem = {
  id: string;
  typeId: string;
  typeName: string;
  /** The item's open intervals in the period, in epoch milliseconds. */
  open: Interval[];
};

/**
 * Active bookable items with their open intervals over the window: own hours, else the venue's,
 * else the calendar's office day, evaluated per local day in the item's zone (ADR 0064).
 */
export async function loadUtilisedItems({
  context,
  period,
}: {
  context: Context;
  period: DashboardWindow;
}): Promise<UtilisedItem[]> {
  const items = await context.db.item.findMany({
    where: { status: "ACTIVE", entityType: { capabilities: { has: "BOOKABLE" } } },
    select: {
      id: true,
      venueId: true,
      venue: { select: { timeZone: true } },
      entityType: { select: { id: true, name: true } },
    },
  });
  const venueIds = canView({ context, feature: "venue" })
    ? [...new Set(items.flatMap((item) => item.venueId ?? []))]
    : [];
  const [zoneOf, own, venues] = await Promise.all([
    loadZoneOfVenue({ context }),
    loadHoursLookups({ context, owner: "itemId", ids: items.map((i) => i.id), ...period }),
    loadHoursLookups({ context, owner: "venueId", ids: venueIds, ...period }),
  ]);
  const daysByZone = new Map<string, ReturnType<typeof daysOf>>();
  return items.map((item) => {
    const timeZone = zoneOf({ venue: item.venue });
    const days = daysByZone.get(timeZone) ?? daysOf({ input: period, timeZone });
    daysByZone.set(timeZone, days);
    const venue = item.venueId ? venues.get(item.venueId) : undefined;
    const hours: HoursLookup = own.get(item.id) ?? venue ?? OFFICE_HOURS;
    const open = days.flatMap((day) =>
      openIntervals({ hours, date: parseIsoDate({ value: day.date }), timeZone }),
    );
    return { id: item.id, typeId: item.entityType.id, typeName: item.entityType.name, open };
  });
}
