import "server-only";
import {
  addDays,
  MAX_CALENDAR_DAYS,
  type PlainDate,
  parseIsoDate,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";
import { ROUTES } from "@/lib/routes";
import { loadOrganizationTimeZone } from "@/server/time-zones";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const isDay = ({ value }: { value: string }) =>
  DAY_KEY.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

/** Today in the organization's zone (ADR 0064 decision 12). */
export async function calendarToday(): Promise<string> {
  const timeZone = await loadOrganizationTimeZone();
  const today: PlainDate = toZonedParts({ instant: new Date(), timeZone }).date;
  return toIsoDate({ date: today });
}

/** `/calendar/{from}/{to}`: inclusive plain days (ADR 0064). */
export const calendarHref = ({ from, to }: { from: string; to: string }) =>
  `${ROUTES.calendar}/${from}/${to}`;

/** The most days a path may hold: what one load reads (`MAX_LOAD_DAYS`). */
const MAX_PATH_DAYS = MAX_CALENDAR_DAYS * 3;

/**
 * The canonical link when the path is not two valid days in order (today instead), or holds more
 * days than one load reads (cut to them); `undefined` when it is canonical.
 */
export async function canonicalCalendarHref({ from, to }: { from: string; to: string }) {
  if (isDay({ value: from }) && isDay({ value: to }) && from <= to) {
    const last = toIsoDate({
      date: addDays({ date: parseIsoDate({ value: from }), days: MAX_PATH_DAYS - 1 }),
    });
    return to <= last ? undefined : calendarHref({ from, to: last });
  }
  const today = await calendarToday();
  return calendarHref({ from: today, to: today });
}
