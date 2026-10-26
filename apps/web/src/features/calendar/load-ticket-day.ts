import "server-only";
import {
  type ItemStateDto,
  type LineDto,
  listItemStates,
  listLines,
  ok,
  type Result,
} from "@bibi/core";
import type { CalendarLine, CalendarState } from "@bibi/ui";
import { listAll } from "@/server/list-all";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { daySegments } from "./day-segments";
import { inkOn } from "./ink-on";

/** A line without a time yet, listed under the lanes. */
export type UnscheduledLine = { id: string; name: string; quantity: number | null };

/** A ticket's day beyond its held bookings: every timed line that day, and the untimed ones. */
export type TicketDay = { lanes: CalendarLine[]; unscheduled: UnscheduledLine[] };

const HOLDS = { HARD: "hard", SOFT: "soft", NONE: "none" } as const;

/** A line's state as the calendar draws it (ADR 0044); grey without one. */
function stateOf({ state }: { state: ItemStateDto | undefined }): CalendarState {
  if (!state) return { name: "", color: "var(--input)", ink: "var(--foreground)", hold: "none" };
  const { name, color } = state;
  return { name, color, ink: inkOn({ color }), hold: HOLDS[state.hold] };
}

type LaneInput = { line: LineDto; date: string; timeZone: string; state: CalendarState };

/** The line's part of `date` in the zone, if it has a time and touches that day. */
function laneOf({ line, date, timeZone, state }: LaneInput): CalendarLine | null {
  if (!line.startsAt || !line.endsAt) return null;
  const segment = daySegments({ startsAt: line.startsAt, endsAt: line.endsAt, timeZone }).find(
    (part) => part.date === date,
  );
  if (!segment) return null;
  return {
    ...{ id: line.id, name: line.name, type: "", place: null, state },
    ...{ start: segment.start, end: segment.end, quantity: line.effectiveQuantity ?? 1 },
    setupMinutes: segment.first ? line.effectiveSetupMinutes : 0,
    teardownMinutes: segment.last ? line.effectiveTeardownMinutes : 0,
    ...(line.parentLineId ? { parentId: line.parentLineId } : {}),
    ...(line.note ? { notes: line.note } : {}),
  };
}

/**
 * The ticket's lines for the booking sheet (ADR 0050 composition: `line.list` and the item
 * states): lanes for `date` in the organization's zone, and the lines with no time yet.
 */
export async function loadTicketDay({
  ticketId,
  date,
}: {
  ticketId: string;
  date: string;
}): Promise<Result<TicketDay>> {
  const [lines, states, timeZone] = await Promise.all([
    listAll({ operation: listLines, input: { ticketId } }),
    listAll({ operation: listItemStates, input: {} }),
    loadOrganizationTimeZone(),
  ]);
  if (!lines.ok) return lines;
  const stateById = new Map((states.ok ? states.value : []).map((state) => [state.id, state]));
  const lanes = lines.value.flatMap((line) => {
    const state = stateOf({ state: line.stateId ? stateById.get(line.stateId) : undefined });
    return laneOf({ line, date, timeZone, state }) ?? [];
  });
  const unscheduled = lines.value
    .filter((line) => !line.startsAt)
    .map(({ id, name, effectiveQuantity }) => ({ id, name, quantity: effectiveQuantity }));
  return ok({ value: { lanes, unscheduled } });
}
