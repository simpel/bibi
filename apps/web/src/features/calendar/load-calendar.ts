import "server-only";
import {
  LINE_SOURCE,
  listEntityTypes,
  listItemStates,
  listItems,
  listLines,
  listOccupancies,
  listTicketPhases,
  listTickets,
  listVenues,
  ok,
  type Result,
  TICKET_OCCUPANCY_SOURCE,
  type VenueDto,
} from "@okazi/core";
import { listAll } from "@/server/list-all";
import { type FilterBlocksInput, filterBlocks } from "./calendar-block-filter";
import {
  type CalendarBlock,
  type ToCalendarBlocksInput,
  toCalendarBlocks,
} from "./calendar-blocks";
import { buildLegend, type LegendState } from "./calendar-legend";
import {
  type SelectedSpaces,
  type SpaceRow,
  selectSpaces,
  type TypeOption,
} from "./calendar-types";

export type CalendarData = {
  venues: Pick<VenueDto, "id" | "name">[];
  /** Bookable types with spaces, for the type filter, and the one shown (`undefined` = all). */
  types: TypeOption[];
  typeId: string | undefined;
  spaces: SpaceRow[];
  blocks: CalendarBlock[];
  /** The organization's states that draw a block, for the legend and the state filter. */
  legend: LegendState[];
  phases: { id: string; name: string }[];
  /** Tickets with a block in the period, for the ticket filter (label: the reference). */
  tickets: { id: string; reference: number }[];
};

export type LoadCalendarInput = {
  from: Date;
  to: Date;
  venueId?: string | undefined;
  typeId?: string | undefined;
  stateId?: string | undefined;
  phaseId?: string | undefined;
  ticketId?: string | undefined;
};

/** Setup time sits right before a line, so its line can start after `to`. */
const PROGRAM_SLACK_MS = 7 * 86_400_000;

function loadSources({ from, to, venueId }: LoadCalendarInput) {
  const spaceFilter = { behaviour: "BOOKABLE" as const, ...(venueId ? { venueId } : {}) };
  const programWindow = { from, to: new Date(to.getTime() + PROGRAM_SLACK_MS) };
  return Promise.all([
    listAll({ operation: listVenues, input: {} }),
    listAll({ operation: listItems, input: spaceFilter }),
    listAll({ operation: listEntityTypes, input: { base: "ITEM" as const } }),
    listAll({ operation: listOccupancies, input: { from, to }, maxPages: 20 }),
    listAll({ operation: listLines, input: programWindow, maxPages: 20 }),
    listAll({ operation: listTickets, input: programWindow, maxPages: 20 }),
    listAll({ operation: listItemStates, input: {} }),
    listAll({ operation: listTicketPhases, input: {} }),
  ]);
}

const pickName = ({ id, name }: { id: string; name: string }) => ({ id, name });

const pickReference = ({ id, reference }: { id: string; reference: number }) => ({
  id,
  reference,
});

type ToCalendarDataInput = Pick<
  ToCalendarBlocksInput,
  "occupancies" | "lines" | "tickets" | "states"
> & {
  selected: SelectedSpaces;
  venues: { id: string; name: string }[];
  phases: { id: string; name: string }[];
  filters: FilterBlocksInput["params"];
};

/** Joins the reads into blocks, narrows them by the filters and derives the legend options. */
function toCalendarData({ selected, venues, phases, filters, ...rest }: ToCalendarDataInput) {
  const spaceIds = new Set(selected.spaces.map(({ id }) => id));
  const all = toCalendarBlocks({
    ...rest,
    occupancies: rest.occupancies.filter(({ itemId }) => spaceIds.has(itemId)),
    sources: { ticket: TICKET_OCCUPANCY_SOURCE, line: LINE_SOURCE },
  });
  const typeIds = new Set(selected.spaces.map(({ entityTypeId }) => entityTypeId));
  const shownTickets = new Set(all.map((block) => block.ticketId));
  return {
    venues: venues.map(pickName),
    ...selected,
    blocks: filterBlocks({ blocks: all, params: filters }),
    legend: buildLegend({ states: rest.states, typeIds, types: selected.types }),
    phases: phases.map(pickName),
    tickets: rest.tickets.filter(({ id }) => shownTickets.has(id)).map(pickReference),
  };
}

/**
 * The calendar's data from existing reads (no operation of its own): the bookable items
 * (spaces) of the venue, one type at a time (`selectSpaces`), their occupancies in `[from, to)`
 * and the lines and tickets those come from, so each block can open its ticket.
 */
export async function loadCalendar({
  typeId,
  stateId,
  phaseId,
  ticketId,
  ...window
}: LoadCalendarInput): Promise<Result<CalendarData>> {
  const [venues, items, types, occupancies, lines, tickets, states, phases] =
    await loadSources(window);
  if (!venues.ok) return venues;
  if (!items.ok) return items;
  if (!types.ok) return types;
  if (!occupancies.ok) return occupancies;
  if (!lines.ok) return lines;
  if (!tickets.ok) return tickets;
  if (!states.ok) return states;
  if (!phases.ok) return phases;
  const selected = selectSpaces({
    spaces: items.value.map(({ id, name, venueId, entityTypeId }) => ({
      ...{ id, name, venueId, entityTypeId },
    })),
    types: types.value.map(pickName),
    typeId,
  });
  return ok({
    value: toCalendarData({
      ...{ occupancies: occupancies.value, lines: lines.value },
      ...{ tickets: tickets.value, states: states.value, selected },
      ...{ venues: venues.value, phases: phases.value, filters: { stateId, phaseId, ticketId } },
    }),
  });
}
