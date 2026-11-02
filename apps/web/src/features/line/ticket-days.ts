import "server-only";
import { type CalendarBlockDto, calendarRange, type LineDto } from "@bibi/core";
import { addDays, fromZonedParts, parseIsoDate, toIsoDate, toZonedParts } from "@bibi/core/schemas";
import type { DaySnapshotRow } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import type { ProgramFormData } from "./ui/program-form-data";
import { dayLabels } from "./ui/ticket-day-labels";
import { ticketDayOf } from "./ui/ticket-day-model";

/** At most this many days get a snapshot; a longer ticket opens the calendar for the rest. */
const MAX_DAYS = 7;

/** One of the ticket's days in the calendar, ready to draw. */
export type TicketDaySnapshot = {
  day: string;
  /** The day as the caller reads it, e.g. "Tue 4 Nov". */
  date: string;
  startMinute: number;
  endMinute: number;
  rows: DaySnapshotRow[];
};

export type TicketDays = { days: TicketDaySnapshot[]; untimed: string[] };

/** The days (YYYY-MM-DD, in the zone) the timed lines touch, in order. */
function daysOf({ lines, timeZone }: { lines: readonly LineDto[]; timeZone: string }) {
  const days = lines.flatMap(({ startsAt, endsAt }) =>
    startsAt && endsAt
      ? [startsAt, new Date(endsAt.getTime() - 1)].map((instant) =>
          toIsoDate({ date: toZonedParts({ instant, timeZone }).date }),
        )
      : [],
  );
  return [...new Set(days)].sort().slice(0, MAX_DAYS);
}

/** Every booking those days (`calendar.range`); none when it may not be read. */
async function loadBlocks({ days }: { days: string[] }): Promise<CalendarBlockDto[]> {
  const [from, last] = [days[0], days[days.length - 1]];
  if (!from || !last) return [];
  const to = toIsoDate({ date: addDays({ date: parseIsoDate({ value: last }), days: 1 }) });
  const result = await runOperation({ operation: calendarRange, input: { from, to } });
  return result.ok ? result.value.blocks : [];
}

export type LoadTicketDaysInput = { ticketId: string; lines: LineDto[]; data: ProgramFormData };

/**
 * The ticket's days in the calendar: per day, everything booked in the organization, the other
 * tickets' dimmed and this ticket's lines solid (the intake's snapshot, ADR 0081). None when the
 * caller may not view items or no line has a time.
 */
export async function loadTicketDays({
  ticketId,
  lines,
  data,
}: LoadTicketDaysInput): Promise<TicketDays> {
  const { timeZone } = data;
  const days = data.itemsHidden ? [] : daysOf({ lines, timeZone });
  if (days.length === 0) return { days: [], untimed: [] };
  const itemNames = new Map(data.items.map(({ id, name }) => [id, name]));
  const [t, format, blocks] = await Promise.all([
    getTranslations("line.day"),
    getDateTimeFormat(),
    loadBlocks({ days }),
  ]);
  const { blockLabel } = dayLabels({ t });
  let untimed: string[] = [];
  const snapshots = days.map((day) => {
    const midnight = fromZonedParts({
      ...{ date: parseIsoDate({ value: day }), time: { hour: 0, minute: 0, second: 0 } },
      timeZone,
    });
    const { untimed: loose, ...snapshot } = ticketDayOf({
      ...{ ticketId, lines, blocks, midnight, itemNames, blockLabel },
      otherLabel: t("otherLines"),
    });
    untimed = loose;
    const date = format.date({ instant: midnight, timeZone, weekday: "short" });
    return { day, date, ...snapshot };
  });
  return { days: snapshots, untimed };
}
