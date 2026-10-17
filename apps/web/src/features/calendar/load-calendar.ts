import "server-only";
import {
  BOOKING_OCCUPANCY_SOURCE,
  listBookings,
  listEntityTypes,
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
import { type SpaceRow, selectSpaces, type TypeOption } from "./calendar-types";

export type CalendarData = {
  venues: Pick<VenueDto, "id" | "name">[];
  /** Bookable types with spaces, for the type filter, and the one shown (`undefined` = all). */
  types: TypeOption[];
  typeId: string | undefined;
  spaces: SpaceRow[];
  blocks: CalendarBlock[];
};

export type LoadCalendarInput = {
  from: Date;
  to: Date;
  venueId?: string | undefined;
  typeId?: string | undefined;
};

/** Setup time sits right before a program item, so its program item can start after `to`. */
const PROGRAM_SLACK_MS = 7 * 86_400_000;

function loadSources({ from, to, venueId }: LoadCalendarInput) {
  const spaceFilter = { behaviour: "BOOKABLE" as const, ...(venueId ? { venueId } : {}) };
  const programWindow = { from, to: new Date(to.getTime() + PROGRAM_SLACK_MS) };
  return Promise.all([
    listAll({ operation: listVenues, input: {} }),
    listAll({ operation: listItems, input: spaceFilter }),
    listAll({ operation: listEntityTypes, input: { base: "ITEM" as const } }),
    listAll({ operation: listOccupancies, input: { from, to }, maxPages: 20 }),
    listAll({ operation: listProgramItems, input: programWindow, maxPages: 20 }),
    listAll({ operation: listBookings, input: programWindow, maxPages: 20 }),
  ]);
}

/**
 * The calendar's data from existing reads (no operation of its own): the bookable items
 * (spaces) of the venue, one type at a time (`selectSpaces`), their occupancies in `[from, to)`
 * and the program items and bookings those come from, so each block can open its booking.
 */
export async function loadCalendar({
  typeId,
  ...window
}: LoadCalendarInput): Promise<Result<CalendarData>> {
  const [venues, items, types, occupancies, programItems, bookings] = await loadSources(window);
  if (!venues.ok) return venues;
  if (!items.ok) return items;
  if (!types.ok) return types;
  if (!occupancies.ok) return occupancies;
  if (!programItems.ok) return programItems;
  if (!bookings.ok) return bookings;
  const selected = selectSpaces({
    spaces: items.value.map(({ id, name, venueId, entityTypeId }) => ({
      id,
      name,
      venueId,
      entityTypeId,
    })),
    types: types.value.map(({ id, name }) => ({ id, name })),
    typeId,
  });
  const spaceIds = new Set(selected.spaces.map(({ id }) => id));
  const blocks = toCalendarBlocks({
    occupancies: occupancies.value.filter(({ itemId }) => spaceIds.has(itemId)),
    programItems: programItems.value,
    bookings: bookings.value,
    sources: { booking: BOOKING_OCCUPANCY_SOURCE, programItem: PROGRAM_ITEM_SOURCE },
  });
  const venueRows = venues.value.map(({ id, name }) => ({ id, name }));
  return ok({ value: { venues: venueRows, ...selected, blocks } });
}
