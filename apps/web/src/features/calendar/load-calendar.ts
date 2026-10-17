import "server-only";
import {
  BOOKING_OCCUPANCY_SOURCE,
  type ItemDto,
  listBookings,
  listItems,
  listOccupancies,
  listProgramItems,
  listVenues,
  ok,
  PROGRAM_ITEM_SOURCE,
  type Result,
  type VenueDto,
} from "@okazi/core";
import { listAll } from "@/server/list-all";
import { type CalendarBlock, toCalendarBlocks } from "./calendar-blocks";

export type CalendarData = {
  venues: Pick<VenueDto, "id" | "name">[];
  spaces: Pick<ItemDto, "id" | "name" | "venueId">[];
  blocks: CalendarBlock[];
};

export type LoadCalendarInput = { from: Date; to: Date; venueId?: string | undefined };

/** Setup time sits right before a program item, so its program item can start after `to`. */
const PROGRAM_SLACK_MS = 7 * 86_400_000;

/**
 * The calendar's data from existing reads (no operation of its own): the bookable items
 * (spaces) of the venue, their occupancies in `[from, to)` and the program items and bookings
 * those occupancies come from, so each block can open its booking.
 */
export async function loadCalendar({
  from,
  to,
  venueId,
}: LoadCalendarInput): Promise<Result<CalendarData>> {
  const window = { from, to };
  const spaceFilter = { behaviour: "BOOKABLE" as const, ...(venueId ? { venueId } : {}) };
  const programWindow = { from, to: new Date(to.getTime() + PROGRAM_SLACK_MS) };
  const [venues, spaces, occupancies, programItems, bookings] = await Promise.all([
    listAll({ operation: listVenues, input: {} }),
    listAll({ operation: listItems, input: spaceFilter }),
    listAll({ operation: listOccupancies, input: window, maxPages: 20 }),
    listAll({ operation: listProgramItems, input: programWindow, maxPages: 20 }),
    listAll({ operation: listBookings, input: programWindow, maxPages: 20 }),
  ]);
  if (!venues.ok) return venues;
  if (!spaces.ok) return spaces;
  if (!occupancies.ok) return occupancies;
  if (!programItems.ok) return programItems;
  if (!bookings.ok) return bookings;
  const spaceIds = new Set(spaces.value.map(({ id }) => id));
  const blocks = toCalendarBlocks({
    occupancies: occupancies.value.filter(({ itemId }) => spaceIds.has(itemId)),
    programItems: programItems.value,
    bookings: bookings.value,
    sources: { booking: BOOKING_OCCUPANCY_SOURCE, programItem: PROGRAM_ITEM_SOURCE },
  });
  return ok({
    value: {
      venues: venues.value.map(({ id, name }) => ({ id, name })),
      spaces: spaces.value.map(({ id, name, venueId: venue }) => ({ id, name, venueId: venue })),
      blocks,
    },
  });
}
