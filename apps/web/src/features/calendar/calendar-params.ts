import {
  addDays,
  fromZonedParts,
  type PlainDate,
  parseIsoDate,
  toIsoDate,
  toZonedParts,
  weekdayOf,
} from "@okazi/core/schemas";

export const CALENDAR_VIEWS = ["day", "week"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

/** The calendar's URL state: `?view=day|week&date=YYYY-MM-DD&venue=<id>&type=<id>|all&state=<id>&phase=<id>&ticket=<id>`, shareable. */
export type CalendarParams = {
  view: CalendarView;
  date: PlainDate;
  venueId?: string | undefined;
  typeId?: string | undefined;
  /** Filters on the line's state, the ticket's phase and the ticket itself. */
  stateId?: string | undefined;
  phaseId?: string | undefined;
  ticketId?: string | undefined;
};

export type RawCalendarParams = Record<string, string | string[] | undefined>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

const first = ({ value }: { value: string | string[] | undefined }): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

function readDate({ value, now, timeZone }: { value?: string; now: Date; timeZone: string }) {
  const today = toZonedParts({ instant: now, timeZone }).date;
  if (!value || !ISO_DATE.test(value)) return today;
  const date = parseIsoDate({ value });
  return toIsoDate({ date }) === value ? date : today;
}

export type ReadCalendarParamsInput = { raw: RawCalendarParams; now: Date; timeZone: string };

/** Parses the query; a missing or invalid date means today in `timeZone`, the view defaults to day. */
export function readCalendarParams({
  raw,
  now,
  timeZone,
}: ReadCalendarParamsInput): CalendarParams {
  const view = first({ value: raw.view }) === "week" ? "week" : "day";
  const value = first({ value: raw.date });
  const date = readDate({ now, timeZone, ...(value ? { value } : {}) });
  return {
    view,
    date,
    venueId: first({ value: raw.venue }),
    typeId: first({ value: raw.type }),
    stateId: first({ value: raw.state }),
    phaseId: first({ value: raw.phase }),
    ticketId: first({ value: raw.ticket }),
  };
}

/** The query string values for `params` (the inverse of `readCalendarParams`). */
export function calendarQuery({ params }: { params: CalendarParams }): Record<string, string> {
  const query: Record<string, string> = {
    view: params.view,
    date: toIsoDate({ date: params.date }),
  };
  if (params.venueId) query.venue = params.venueId;
  if (params.typeId) query.type = params.typeId;
  if (params.stateId) query.state = params.stateId;
  if (params.phaseId) query.phase = params.phaseId;
  if (params.ticketId) query.ticket = params.ticketId;
  return query;
}

/** The days shown: the date itself, or Monday to Sunday of its week. */
export function calendarDays({ params }: { params: CalendarParams }): PlainDate[] {
  if (params.view === "day") return [params.date];
  const monday = addDays({ date: params.date, days: -weekdayOf({ date: params.date }) });
  return Array.from({ length: 7 }, (_, days) => addDays({ date: monday, days }));
}

export type DayStartInput = { date: PlainDate; timeZone: string };

/** Midnight of `date` in `timeZone`. */
export const dayStart = ({ date, timeZone }: DayStartInput): Date =>
  fromZonedParts({ date, time: MIDNIGHT, timeZone });

/** The shown period `[from, to)` as instants. */
export function calendarRange({ params, timeZone }: { params: CalendarParams; timeZone: string }) {
  const days = calendarDays({ params });
  const last = days[days.length - 1] ?? params.date;
  return {
    from: dayStart({ date: days[0] ?? params.date, timeZone }),
    to: dayStart({ date: addDays({ date: last, days: 1 }), timeZone }),
  };
}

export type ShiftInput = { params: CalendarParams; step: -1 | 1 };

/** The previous or next day or week. */
export function shiftCalendar({ params, step }: ShiftInput): CalendarParams {
  const days = params.view === "day" ? step : step * 7;
  return { ...params, date: addDays({ date: params.date, days }) };
}
