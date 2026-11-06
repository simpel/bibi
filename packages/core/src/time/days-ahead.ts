import { addDays } from "./plain-date";
import { fromZonedParts, toZonedParts } from "./zoned-time";

export type AtDaysAheadInput = {
  now: Date;
  /** Days after today in `timeZone`; 0 is today. */
  days: number;
  /** Local wall time `HH:MM`. */
  time: string;
  timeZone: string;
};

/** The instant `days` after today at the local time `HH:MM` in `timeZone` (ADR 0064). */
export function atDaysAhead({ now, days, time, timeZone }: AtDaysAheadInput): Date {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const today = toZonedParts({ instant: now, timeZone }).date;
  const date = addDays({ date: today, days });
  return fromZonedParts({ date, time: { hour, minute, second: 0 }, timeZone });
}
