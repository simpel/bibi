import "server-only";
import { type CalendarBlockDto, calendarRange, ok, type Result, type VenueDto } from "@bibi/core";
import { toIsoDate } from "@bibi/core/schemas";
import { runOperation } from "@/server/run-operation";
import { buildLegend, type LegendState } from "./calendar-legend";
import type { CalendarPeriod } from "./calendar-period";
import { loadSources, orEmpty } from "./calendar-sources";
import { type SpaceRow, selectSpaces, type TypeOption } from "./calendar-types";

export type CalendarData = {
  venues: Pick<VenueDto, "id" | "name">[];
  /** Bookable types with spaces, for the type filter, and the one shown (`undefined` = all). */
  types: TypeOption[];
  typeId: string | undefined;
  spaces: SpaceRow[];
  blocks: CalendarBlockDto[];
  /** The organization's states that draw a block, for the legend and the state filter. */
  legend: LegendState[];
  statuses: { id: string; name: string }[];
  /** Tickets with a block in the period, for the ticket filter (label: the reference). */
  tickets: { id: string; reference: number }[];
};

export type LoadCalendarInput = {
  period: CalendarPeriod;
  venueId?: string | undefined;
  typeId?: string | undefined;
  stateId?: string | undefined;
  statusId?: string | undefined;
  ticketId?: string | undefined;
};

const pickName = ({ id, name }: { id: string; name: string }) => ({ id, name });

/** Unique tickets of the blocks, by reference. */
function ticketsOf({ blocks }: { blocks: CalendarBlockDto[] }) {
  const byId = new Map<string, number>();
  for (const { ticketId, reference } of blocks) {
    if (ticketId && reference !== null) byId.set(ticketId, reference);
  }
  return [...byId]
    .map(([id, reference]) => ({ id, reference }))
    .sort((a, b) => a.reference - b.reference);
}

type ConfigInput = { venueId: string | undefined; typeId: string | undefined };

/** The config lists, with the spaces of the one type shown (`selectSpaces`). */
async function loadConfig({ venueId, typeId }: ConfigInput) {
  const [venues, rawItems, rawTypes, states, statuses] = await loadSources({ venueId });
  const items = orEmpty({ result: rawItems });
  const types = orEmpty({ result: rawTypes });
  const lists = orEmpty({ result: venues });
  if (!lists.ok) return lists;
  if (!items.ok) return items;
  if (!types.ok) return types;
  if (!states.ok) return states;
  if (!statuses.ok) return statuses;
  const selected = selectSpaces({
    spaces: items.value.map(({ id, name, venueId: item, entityTypeId }) => ({
      ...{ id, name, venueId: item, entityTypeId },
    })),
    types: types.value.map(pickName),
    typeId,
  });
  return ok({
    value: { venues: lists.value, states: states.value, statuses: statuses.value, selected },
  });
}

/**
 * The calendar's data: the config lists (`selectSpaces` keeps one type at a time) and the
 * blocks of `calendar.range`, restricted to the spaces shown.
 */
export async function loadCalendar({
  period,
  ...filters
}: LoadCalendarInput): Promise<Result<CalendarData>> {
  const config = await loadConfig({ venueId: filters.venueId, typeId: filters.typeId });
  if (!config.ok) return config;
  const { venues, states, statuses, selected } = config.value;
  const range = await runOperation({
    operation: calendarRange,
    input: {
      from: toIsoDate({ date: period.from }),
      to: toIsoDate({ date: period.to }),
      ...{ ...filters, typeId: selected.typeId },
    },
  });
  if (!range.ok) return range;
  const spaceIds = new Set(selected.spaces.map(({ id }) => id));
  const blocks = range.value.blocks.filter(({ itemId }) => spaceIds.has(itemId));
  const typeIds = new Set(selected.spaces.map(({ entityTypeId }) => entityTypeId));
  return ok({
    value: {
      venues: venues.map(pickName),
      ...selected,
      blocks,
      legend: buildLegend({ states, typeIds, types: selected.types }),
      statuses: statuses.map(pickName),
      tickets: ticketsOf({ blocks }),
    },
  });
}
