import { fromZonedParts, parseIsoDate, toIsoDate, toZonedParts } from "@bibi/core/schemas";

export type DayInput = { day: string; timeZone: string };
export type InstantDayInput = { instant: Date | null; timeZone: string };

/** The last moment of a local day: where "open until" and a season's end sit (ADR 0064). */
export function endOfDay({ day, timeZone }: DayInput): Date {
  const date = parseIsoDate({ value: day });
  return fromZonedParts({ date, time: { hour: 23, minute: 59, second: 59 }, timeZone });
}

/** The first moment of a local day: where a season starts. */
export function startOfDay({ day, timeZone }: DayInput): Date {
  const date = parseIsoDate({ value: day });
  return fromZonedParts({ date, time: { hour: 0, minute: 0, second: 0 }, timeZone });
}

/** The local day (`YYYY-MM-DD`) an instant falls on in the zone; "" for none. */
export function dayOf({ instant, timeZone }: InstantDayInput): string {
  if (!instant) return "";
  return toIsoDate({ date: toZonedParts({ instant, timeZone }).date });
}

export type AtTimeInput = { day: string; time: string; timeZone: string };

/** The instant a local day and `HH:mm` are in the zone; a blank time is midnight. */
export function atTime({ day, time, timeZone }: AtTimeInput): Date {
  const [hour, minute] = time.split(":").map(Number);
  const date = parseIsoDate({ value: day });
  return fromZonedParts({
    date,
    time: { hour: hour ?? 0, minute: minute ?? 0, second: 0 },
    timeZone,
  });
}
