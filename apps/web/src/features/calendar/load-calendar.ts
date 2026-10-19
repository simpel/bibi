import "server-only";
import {
  ok,
  PROGRAM_ITEM_SOURCE,
  type Result,
  TICKET_OCCUPANCY_SOURCE,
  type VenueDto,
} from "@okazi/core";
import { type FilterBlocksInput, filterBlocks } from "./calendar-block-filter";
import {
  type CalendarBlock,
  type ToCalendarBlocksInput,
  toCalendarBlocks,
} from "./calendar-blocks";
import { buildLegend, type LegendState } from "./calendar-legend";
import { loadSources, orEmpty } from "./calendar-sources";
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

const pickName = ({ id, name }: { id: string; name: string }) => ({ id, name });

const pickReference = ({ id, reference }: { id: string; reference: number }) => ({
  id,
  reference,
});

type ToCalendarDataInput = Pick<
  ToCalendarBlocksInput,
  "occupancies" | "programItems" | "tickets" | "states"
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
    sources: { ticket: TICKET_OCCUPANCY_SOURCE, programItem: PROGRAM_ITEM_SOURCE },
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
 * and the program items and tickets those come from, so each block can open its ticket.
 */
export async function loadCalendar({
  typeId,
  stateId,
  phaseId,
  ticketId,
  ...window
}: LoadCalendarInput): Promise<Result<CalendarData>> {
  const sources = await loadSources(window);
  const [occupancies, tickets, states, phases] = [sources[3], sources[5], sources[6], sources[7]];
  const venues = orEmpty({ result: sources[0] });
  const items = orEmpty({ result: sources[1] });
  const types = orEmpty({ result: sources[2] });
  const programItems = orEmpty({ result: sources[4] });
  if (!venues.ok) return venues;
  if (!items.ok) return items;
  if (!types.ok) return types;
  if (!occupancies.ok) return occupancies;
  if (!programItems.ok) return programItems;
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
      ...{ occupancies: occupancies.value, programItems: programItems.value },
      ...{ tickets: tickets.value, states: states.value, selected },
      ...{ venues: venues.value, phases: phases.value, filters: { stateId, phaseId, ticketId } },
    }),
  });
}
