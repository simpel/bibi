import "server-only";
import {
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
} from "@bibi/core";
import { listAll } from "@/server/list-all";

export type CalendarWindow = {
  from: Date;
  to: Date;
  venueId?: string | undefined;
};

/** Setup time sits right before a line, so its line can start after `to`. */
const PROGRAM_SLACK_MS = 7 * 86_400_000;

/** Every read the calendar joins, in a fixed order (see `readSources`). */
export function loadSources({ from, to, venueId }: CalendarWindow) {
  const spaceFilter = { capability: "BOOKABLE" as const, ...(venueId ? { venueId } : {}) };
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

export type OrEmptyInput<T> = { result: Result<T[]> };

/**
 * Another feature's rows the calendar can do without (ADR 0050 feature scope): without `read`
 * on it the rows are simply empty, so the page degrades instead of failing.
 */
export const orEmpty = <T>({ result }: OrEmptyInput<T>): Result<T[]> =>
  !result.ok && result.error.code === "FORBIDDEN" ? ok({ value: [] }) : result;
