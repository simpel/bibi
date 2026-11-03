import { addDays, fromZonedParts, toZonedParts } from "@bibi/core/schemas";

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

export type TodayWindowInput = { now: Date; timeZone: string };

/** Today in the organization's zone (ADR 0064), as instants: its midnight to the next. */
export function todayWindow({ now, timeZone }: TodayWindowInput): { from: Date; to: Date } {
  const { date } = toZonedParts({ instant: now, timeZone });
  return {
    from: fromZonedParts({ date, time: MIDNIGHT, timeZone }),
    to: fromZonedParts({ date: addDays({ date, days: 1 }), time: MIDNIGHT, timeZone }),
  };
}
