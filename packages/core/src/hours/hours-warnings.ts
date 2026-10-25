import type { OperationContext } from "../operations/types";
import { canView } from "../shared/can-view";
import { loadZoneOfVenue } from "../shared/time-zones";
import { addDays, parseIsoDate, toIsoDate } from "../time/plain-date";
import { loadHoursLookups } from "./load-lookups";
import { withinHours } from "./within-hours";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };

/** What the evaluator needs of a line. */
export type TimedLine = {
  id: string;
  itemId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

type Timed = { id: string; itemId: string; startsAt: Date; endsAt: Date };

const isTimed = ({ line }: { line: TimedLine }): boolean =>
  line.itemId !== null && line.startsAt !== null && line.endsAt !== null;

/** UTC dates one day around the lines: wide enough for any zone's local days. */
function dateRange({ lines }: { lines: readonly Timed[] }) {
  const day = ({ ms, days }: { ms: number; days: number }) =>
    toIsoDate({
      date: addDays({
        date: parseIsoDate({ value: new Date(ms).toISOString().slice(0, 10) }),
        days,
      }),
    });
  const starts = lines.map((line) => line.startsAt.getTime());
  const ends = lines.map((line) => line.endsAt.getTime());
  return {
    from: day({ ms: Math.min(...starts), days: -1 }),
    to: day({ ms: Math.max(...ends), days: 1 }),
  };
}

async function loadSources({ context, lines }: Db & { lines: readonly Timed[] }) {
  const items = await context.db.item.findMany({
    where: {
      id: { in: [...new Set(lines.map((line) => line.itemId))] },
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    select: { id: true, venueId: true, venue: { select: { timeZone: true } } },
  });
  // Venue hours are venue data (ADR 0050): without venue:read they neither show nor warn.
  const venues = canView({ context, feature: "venue" });
  const venueIds = venues
    ? [...new Set(items.flatMap((item) => (item.venueId ? [item.venueId] : [])))]
    : [];
  const range = dateRange({ lines });
  const [zoneOf, ownHours, venueHours] = await Promise.all([
    loadZoneOfVenue({ context }),
    loadHoursLookups({ context, owner: "itemId", ids: items.map((item) => item.id), ...range }),
    loadHoursLookups({ context, owner: "venueId", ids: venueIds, ...range }),
  ]);
  return { items: new Map(items.map((item) => [item.id, item])), zoneOf, ownHours, venueHours };
}

type HoursWarning = { id: string; kind: "OUTSIDE_ITEM_HOURS" | "OUTSIDE_VENUE_HOURS" };

/**
 * A warning per timed line that falls outside the hours that apply (ADR 0064 rule 11), in the
 * item's zone: `OUTSIDE_ITEM_HOURS` (id = the item) against its own working hours, else
 * `OUTSIDE_VENUE_HOURS` (id = the venue) against its venue's opening hours. A fixed number of
 * queries; nothing is stored or enforced.
 */
export async function loadHoursWarnings({ context, lines }: Db & { lines: readonly TimedLine[] }) {
  const byLine = new Map<string, HoursWarning>();
  const timed = lines.filter((line) => isTimed({ line })) as Timed[];
  if (timed.length === 0) return byLine;
  const { items, zoneOf, ownHours, venueHours } = await loadSources({ context, lines: timed });
  for (const line of timed) {
    const item = items.get(line.itemId);
    if (!item) continue;
    const own = ownHours.get(item.id);
    const venue = item.venueId ? venueHours.get(item.venueId) : undefined;
    const hours = own ?? venue;
    if (!hours) continue;
    const timeZone = zoneOf({ venue: item.venue });
    if (withinHours({ hours, timeZone, startsAt: line.startsAt, endsAt: line.endsAt })) continue;
    const warning: HoursWarning = own
      ? { id: item.id, kind: "OUTSIDE_ITEM_HOURS" }
      : { id: item.venueId ?? "", kind: "OUTSIDE_VENUE_HOURS" };
    byLine.set(line.id, warning);
  }
  return byLine;
}
