import "server-only";
import { type PlainDate, toIsoDate, toZonedParts } from "@bibi/core/schemas";
import { loadUserPreferences } from "@/features/user-preference/load";
import { loadOrganizationTimeZone, loadVenueTimeZone } from "@/server/time-zones";
import {
  CALENDAR_VIEW_PREFERENCE,
  calendarHref,
  legacyPeriod,
  type RawCalendarParams,
  readCalendarFilters,
  readPreferredView,
} from "./calendar-params";
import { periodFor, readCalendarPeriod } from "./calendar-period";

/** The filtered venue's zone, else the organization's (ADR 0064 decision 12). */
export async function calendarTimeZone({ venueId }: { venueId: string | undefined }) {
  return venueId ? loadVenueTimeZone({ venueId }) : loadOrganizationTimeZone();
}

/** Today's date in `timeZone`. */
export const todayIn = ({ timeZone }: { timeZone: string }): PlainDate =>
  toZonedParts({ instant: new Date(), timeZone }).date;

/**
 * Where bare `/calendar` goes: an old `?view=&date=` link to its period, anything else to today
 * in the user's preferred view (ADR 0039). The filters are kept.
 */
export async function calendarStartHref({ raw }: { raw: RawCalendarParams }) {
  const filters = readCalendarFilters({ raw });
  const today = todayIn({ timeZone: await calendarTimeZone({ venueId: filters.venueId }) });
  const legacy = legacyPeriod({ raw, today });
  if (legacy) return calendarHref({ params: { ...filters, period: legacy } });
  const preferences = await loadUserPreferences({ prefix: CALENDAR_VIEW_PREFERENCE });
  const view = readPreferredView({ value: preferences[CALENDAR_VIEW_PREFERENCE] });
  return calendarHref({ params: { ...filters, period: periodFor({ view, anchor: today }) } });
}

export type CanonicalInput = { from: string; to: string; raw: RawCalendarParams };

/** The canonical link when the path is not (an invalid date, a reversed or too long range). */
export async function canonicalCalendarHref({ from, to, raw }: CanonicalInput) {
  const filters = readCalendarFilters({ raw });
  const today = todayIn({ timeZone: await calendarTimeZone({ venueId: filters.venueId }) });
  const period = readCalendarPeriod({ from, to, today });
  const same = toIsoDate({ date: period.from }) === from && toIsoDate({ date: period.to }) === to;
  return same ? undefined : calendarHref({ params: { ...filters, period } });
}
