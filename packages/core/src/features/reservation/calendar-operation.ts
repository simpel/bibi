import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { nowOf } from "../../time/now";
import { addDays, type PlainDate, parseIsoDate, toIsoDate } from "../../time/plain-date";
import {
  type CalendarDay,
  ReservationCalendarInputSchema,
  ReservationCalendarOutputSchema,
} from "./calendar-schema";
import { evaluateDay } from "./evaluate";
import { loadRoomDay } from "./room-day";

const CHUNK = 6;

/** The dates of a `YYYY-MM` month. */
function datesOf({ month }: { month: string }): PlainDate[] {
  const dates: PlainDate[] = [];
  let date = parseIsoDate({ value: `${month}-01` });
  while (toIsoDate({ date }).startsWith(month)) {
    dates.push(date);
    date = addDays({ date, days: 1 });
  }
  return dates;
}

export type MonthDaysInput = {
  context: Parameters<typeof loadRoomDay>[0]["context"] & { now?: () => Date };
  roomItemId: string;
  month: string;
  partySize: number;
  /** A guest moving their own booking: it does not count against the times. */
  except?: string;
};

/** Each date of a month as a guest would meet it, with the room's zone. */
export async function monthDays({ context, roomItemId, month, partySize, except }: MonthDaysInput) {
  const now = nowOf({ context });
  const dates = datesOf({ month });
  let timeZone = "";
  const days: CalendarDay[] = [];
  for (let at = 0; at < dates.length; at += CHUNK) {
    const chunk = await Promise.all(
      dates.slice(at, at + CHUNK).map(async (date) => {
        const day = await loadRoomDay({ context, roomItemId, date });
        if (!day.ok) return day;
        const room = day.value;
        const slots = await evaluateDay({
          ...{ context, day: room, date, partySize, online: true, now },
          ...(except ? { except } : {}),
        });
        const starts = slots.filter((slot) => slot.available).length;
        const closedByException = [...room.overrides.values()].some((one) => one.closed);
        const status: CalendarDay["status"] = (() => {
          if (room.closed) return "CLOSED";
          if (slots.length === 0) return closedByException ? "CLOSED" : "NO_SITTING";
          if (starts > 0) return "OPEN";
          const late = slots.every((slot) => slot.warnings.includes("OUTSIDE_ONLINE_WINDOW"));
          return late ? "OUTSIDE_WINDOW" : "FULL";
        })();
        return ok({
          value: {
            timeZone: room.timeZone,
            day: { date: toIsoDate({ date }), status, starts, total: slots.length },
          },
        });
      }),
    );
    for (const one of chunk) {
      if (!one.ok) return one;
      timeZone = one.value.timeZone;
      days.push(one.value.day);
    }
  }
  return ok({ value: { timeZone, days } });
}

export const reservationCalendar = defineOperation({
  name: "reservation.calendar",
  kind: "query",
  description:
    "What a guest would meet in a dining room on each date of a month (ADR 0119): open (with " +
    "how many start times), full, closed, no sitting, or outside the online window. Applies the " +
    "guest rules. Answers 'is Friday 12 December bookable for 6?' and 'which days are closed?'.",
  input: ReservationCalendarInputSchema,
  output: ReservationCalendarOutputSchema,
  permission: "reservation:read",
  handler: ({ input, context }) =>
    monthDays({
      ...{ context, roomItemId: input.roomItemId, month: input.month },
      partySize: input.partySize,
    }),
});
