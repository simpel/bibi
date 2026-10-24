import type { PlainDate } from "./plain-date";

/** Wall-clock time of day in a time zone. */
export type WallTime = { hour: number; minute: number; second: number };

export type ZonedParts = { date: PlainDate; time: WallTime };

type ZonedInput = { instant: Date; timeZone: string };

/** True when `timeZone` is an IANA zone the runtime knows. */
export function isValidTimeZone({ timeZone }: { timeZone: string }): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date and wall time `instant` has in `timeZone`. */
export function toZonedParts({ instant, timeZone }: ZonedInput): ZonedParts {
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const parts = Object.fromEntries(
    format.formatToParts(instant).map((part) => [part.type, Number(part.value)]),
  );
  return {
    date: { year: parts.year ?? 0, month: parts.month ?? 1, day: parts.day ?? 1 },
    time: { hour: parts.hour ?? 0, minute: parts.minute ?? 0, second: parts.second ?? 0 },
  };
}

function offsetMs({ instant, timeZone }: ZonedInput): number {
  const { date, time } = toZonedParts({ instant, timeZone });
  const asUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, time.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

const DAY_MS = 86_400_000;

/**
 * The instant at which `timeZone` shows `date` + `time`. A wall time skipped by a daylight saving
 * change (e.g. 02:30 on the spring-forward night) resolves to the instant one hour later. An
 * ambiguous wall time (the autumn overlap) resolves to the earlier of its two instants.
 */
export function fromZonedParts({ date, time, timeZone }: ZonedParts & { timeZone: string }): Date {
  const asUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, time.second);
  const before = offsetMs({ instant: new Date(asUtc - DAY_MS), timeZone });
  const after = offsetMs({ instant: new Date(asUtc + DAY_MS), timeZone });
  const valid = [...new Set([before, after])]
    .map((offset) => asUtc - offset)
    .filter((ms) => offsetMs({ instant: new Date(ms), timeZone }) === asUtc - ms);
  if (valid.length > 0) return new Date(Math.min(...valid));
  return new Date(asUtc - before);
}
