import {
  addDays,
  compareDates,
  daysInMonth,
  type PlainDate,
  toIsoDate,
} from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import type { ModelDraft, ModelTime } from "./model-draft-schema";

export type ResolveDayInput = {
  date: NonNullable<ModelDraft["date"]>;
  /** When the message came in (or now for pasted text). */
  reference: Date;
  timeZone: string;
};

/**
 * The day the model read (ADR 0084 decision 4): with its year as written, else the next such
 * day on or after the reference day in the organization's zone. Null for a day the month lacks.
 */
export function resolveDay({ date, reference, timeZone }: ResolveDayInput): PlainDate | null {
  const today = toZonedParts({ instant: reference, timeZone }).date;
  const at = ({ year }: { year: number }) => ({ year, month: date.month, day: date.day });
  let day = at({ year: date.year ?? today.year });
  if (date.year === null && compareDates({ a: day, b: today }) < 0) {
    day = at({ year: today.year + 1 });
  }
  if (date.day > daysInMonth({ date: { ...day, day: 1 } })) return null;
  return day;
}

const wallTime = ({ time }: { time: string }) => {
  const [hour, minute] = time.split(":").map(Number);
  return { hour: hour ?? 0, minute: minute ?? 0, second: 0 };
};

export type ResolveInstantsInput = {
  day: PlainDate;
  start: ModelTime | null;
  end: ModelTime | null;
  timeZone: string;
};

/** Start and end as instants on the day in the zone; an end at or before the start is next day. */
export function resolveInstants({ day, start, end, timeZone }: ResolveInstantsInput) {
  const instant = ({ time }: { time: ModelTime }) =>
    fromZonedParts({ date: day, time: wallTime({ time: time.time }), timeZone });
  const startsAt = start ? instant({ time: start }) : null;
  let endsAt = end ? instant({ time: end }) : null;
  if (startsAt && endsAt && endsAt <= startsAt) {
    const next = addDays({ date: day, days: 1 });
    endsAt = fromZonedParts({ date: next, time: wallTime({ time: end?.time ?? "" }), timeZone });
  }
  return { startsAt, endsAt };
}

/** `YYYY-MM-DD (Friday)`: the reference day the model resolves relative dates from. */
export function receivedOn({ reference, timeZone }: { reference: Date; timeZone: string }) {
  const weekday = new Intl.DateTimeFormat("en", { weekday: "long", timeZone }).format(reference);
  return `${toIsoDate({ date: toZonedParts({ instant: reference, timeZone }).date })} (${weekday})`;
}
