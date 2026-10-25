import "server-only";
import {
  listEntityTypes,
  listItemStates,
  listItems,
  listTicketStatuses,
  listVenues,
  ok,
  type Result,
} from "@bibi/core";
import { listAll } from "@/server/list-all";

export type CalendarSourcesInput = { venueId?: string | undefined };

/** The small config lists the filters and rows need, in a fixed order (see `loadCalendar`). */
export function loadSources({ venueId }: CalendarSourcesInput) {
  const spaceFilter = { capability: "BOOKABLE" as const, ...(venueId ? { venueId } : {}) };
  return Promise.all([
    listAll({ operation: listVenues, input: {} }),
    listAll({ operation: listItems, input: spaceFilter }),
    listAll({ operation: listEntityTypes, input: { base: "ITEM" as const } }),
    listAll({ operation: listItemStates, input: {} }),
    listAll({ operation: listTicketStatuses, input: {} }),
  ]);
}

export type OrEmptyInput<T> = { result: Result<T[]> };

/**
 * Another feature's rows the calendar can do without (ADR 0050 feature scope): without `read`
 * on it the rows are simply empty, so the page degrades instead of failing.
 */
export const orEmpty = <T>({ result }: OrEmptyInput<T>): Result<T[]> =>
  !result.ok && result.error.code === "FORBIDDEN" ? ok({ value: [] }) : result;
