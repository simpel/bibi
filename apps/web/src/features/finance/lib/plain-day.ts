import { type DateTimeFormat, fromZonedParts, parseIsoDate } from "@bibi/core/schemas";

export type PlainDayTextInput = { day: string; timeZone: string; dates: DateTimeFormat };

/** A plain `YYYY-MM-DD` written at noon in `timeZone`, so no zone can move it to another day. */
export function plainDayText({ day, timeZone, dates }: PlainDayTextInput): string {
  const instant = fromZonedParts({
    date: parseIsoDate({ value: day }),
    time: { hour: 12, minute: 0, second: 0 },
    timeZone,
  });
  return dates.date({ instant, timeZone });
}
