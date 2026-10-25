import { loadHoursLookups } from "../../hours/load-lookups";
import type { HoursLookup } from "../../hours/within-hours";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { loadZoneOfVenue } from "../../shared/time-zones";
import {
  addDays,
  compareDates,
  type PlainDate,
  parseIsoDate,
  toIsoDate,
} from "../../time/plain-date";
import { fromZonedParts } from "../../time/zoned-time";
import { dayValues, type PricedItem, type RangeDay } from "./day-values";
import type { CalendarBlockDto, CalendarRangeInput } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;
const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

/** Without hours of its own or its venue's: an office day, 08–18 every day, as the calendar draws. */
const OFFICE_DAY = {
  startMinute: 8 * 60,
  endMinute: 18 * 60,
  breakStartMinute: null,
  breakEndMinute: null,
};
const OFFICE_HOURS: HoursLookup = {
  days: new Map(Array.from({ length: 7 }, (_, weekday) => [weekday, OFFICE_DAY] as const)),
  exceptions: new Map(),
};

/** The range's local days as instants in its zone (ADR 0064: 23 or 25 hours long at a shift). */
function daysOf({ input, timeZone }: { input: CalendarRangeInput; timeZone: string }) {
  const days: RangeDay[] = [];
  const last = parseIsoDate({ value: input.to });
  for (let date = parseIsoDate({ value: input.from }); compareDates({ a: date, b: last }) <= 0; ) {
    const next = addDays({ date, days: 1 });
    const at = ({ day }: { day: PlainDate }) =>
      fromZonedParts({ date: day, time: MIDNIGHT, timeZone }).getTime();
    days.push({ date: toIsoDate({ date }), from: at({ day: date }), to: at({ day: next }) });
    date = next;
  }
  return days;
}

/**
 * Bookable items priced by the hour (rooms, boats; equipment is priced flat and never counts),
 * each with the hours that apply and the zone they are in.
 */
async function loadPricedItems({
  context,
  input,
}: {
  context: Context;
  input: CalendarRangeInput;
}) {
  const items = await context.db.item.findMany({
    where: {
      status: "ACTIVE",
      priceMinor: { not: null },
      priceUnit: "PER_HOUR",
      entityType: { capabilities: { has: "BOOKABLE" } },
      ...(input.venueId ? { venueId: input.venueId } : {}),
      ...(input.typeId ? { entityTypeId: input.typeId } : {}),
    },
    select: { id: true, priceMinor: true, venueId: true, venue: { select: { timeZone: true } } },
  });
  // Venue hours are venue data (ADR 0050), as in the hours warnings.
  const venueIds = canView({ context, feature: "venue" })
    ? [...new Set(items.flatMap((item) => item.venueId ?? []))]
    : [];
  const range = { from: input.from, to: input.to };
  const [zoneOf, own, venues] = await Promise.all([
    loadZoneOfVenue({ context }),
    loadHoursLookups({ context, owner: "itemId", ids: items.map((item) => item.id), ...range }),
    loadHoursLookups({ context, owner: "venueId", ids: venueIds, ...range }),
  ]);
  return items.flatMap((item): PricedItem[] => {
    const venue = item.venueId ? venues.get(item.venueId) : undefined;
    const hours = own.get(item.id) ?? venue ?? OFFICE_HOURS;
    if (item.priceMinor === null) return [];
    const timeZone = zoneOf({ venue: item.venue });
    return [{ id: item.id, priceMinor: item.priceMinor, hours, timeZone }];
  });
}

export type LoadValuesInput = {
  context: Context;
  input: CalendarRangeInput;
  timeZone: string;
  blocks: readonly CalendarBlockDto[];
};

/**
 * What each item's days are worth (ADR 0071 view read model): the lines' values with
 * `program:read`; the open time with `item:read`, and only unfiltered by line, since a line
 * filter hides the holds that take the time.
 */
export async function loadValues({ context, input, timeZone, blocks }: LoadValuesInput) {
  const lines = canView({ context, feature: "program" });
  const lineFilter = Boolean(input.ticketId || input.stateId || input.statusId);
  const open = canView({ context, feature: "item" }) && !lineFilter;
  const items = open ? await loadPricedItems({ context, input }) : [];
  return dayValues({ days: daysOf({ input, timeZone }), blocks, items, lines, open });
}
