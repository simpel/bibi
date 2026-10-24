import { addDays, fromZonedParts, type PlainDate } from "@bibi/core/schemas";
import {
  CALENDAR_VIEWS,
  type CalendarPeriod,
  type CalendarView,
  periodFor,
  periodPath,
  readPlainDate,
} from "./calendar-period";

/** The optional filters: query strings next to the `/calendar/{from}/{to}` path (ADR 0064). */
export type CalendarFilters = {
  venueId?: string | undefined;
  typeId?: string | undefined;
  /** Filters on the line's state, the ticket's phase and the ticket itself. */
  stateId?: string | undefined;
  phaseId?: string | undefined;
  ticketId?: string | undefined;
};

/** The calendar's URL state, shareable: the period from the path, the filters from the query. */
export type CalendarParams = CalendarFilters & { period: CalendarPeriod };

export type RawCalendarParams = Record<string, string | string[] | undefined>;

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

const first = ({ value }: { value: string | string[] | undefined }): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

/** The filters in the query; anything else in it is ignored. */
export function readCalendarFilters({ raw }: { raw: RawCalendarParams }): CalendarFilters {
  return {
    venueId: first({ value: raw.venue }),
    typeId: first({ value: raw.type }),
    stateId: first({ value: raw.state }),
    phaseId: first({ value: raw.phase }),
    ticketId: first({ value: raw.ticket }),
  };
}

/** The query string values of the filters (the inverse of `readCalendarFilters`). */
export function calendarQuery({ params }: { params: CalendarFilters }): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.venueId) query.venue = params.venueId;
  if (params.typeId) query.type = params.typeId;
  if (params.stateId) query.state = params.stateId;
  if (params.phaseId) query.phase = params.phaseId;
  if (params.ticketId) query.ticket = params.ticketId;
  return query;
}

/** The link to `params`: the period in the path, the filters in the query. */
export const calendarHref = ({ params }: { params: CalendarParams }) => ({
  pathname: periodPath({ period: params.period }),
  query: calendarQuery({ params }),
});

/**
 * The period an old `?view=day|week&date=` link meant, or `undefined` when it has neither, so
 * those links keep working after the move to the path (ADR 0064).
 */
export function legacyPeriod({ raw, today }: { raw: RawCalendarParams; today: PlainDate }) {
  const view = first({ value: raw.view });
  const date = first({ value: raw.date });
  if (!view && !date) return undefined;
  const anchor = readPlainDate({ value: date }) ?? today;
  return periodFor({ view: view === "week" ? "week" : "day", anchor });
}

/** The user preference (ADR 0039) that holds the view bare `/calendar` opens in. */
export const CALENDAR_VIEW_PREFERENCE = "calendar.view";

/** A stored view preference, or day when there is none or it is not a view. */
export const readPreferredView = ({ value }: { value: unknown }): CalendarView =>
  CALENDAR_VIEWS.find((view) => view === value) ?? "day";

export type DayStartInput = { date: PlainDate; timeZone: string };

/** Midnight of `date` in `timeZone`. */
export const dayStart = ({ date, timeZone }: DayStartInput): Date =>
  fromZonedParts({ date, time: MIDNIGHT, timeZone });

/** The shown period `[start of from, start of to + 1 day)` as instants. */
export const calendarRange = ({
  period,
  timeZone,
}: {
  period: CalendarPeriod;
  timeZone: string;
}) => ({
  from: dayStart({ date: period.from, timeZone }),
  to: dayStart({ date: addDays({ date: period.to, days: 1 }), timeZone }),
});
