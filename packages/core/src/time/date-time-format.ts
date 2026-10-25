import {
  DEFAULT_CLOCK_FORMAT,
  DEFAULT_DATE_FORMAT,
  type DisplayFormats,
  type InstantLike,
  toInstant,
} from "./display-formats";
import { formatClock } from "./format-clock";
import { formatDate, formatWeekday, namesMonth } from "./format-date";

/** The part of a user's formats that dates and times use. */
export type DateTimeFormats = Pick<DisplayFormats, "dateFormat" | "clockFormat">;

export type CreateDateTimeFormatInput = {
  /** The UI language (next-intl locale): month and weekday names, AM/PM. */
  locale: string;
  /** The zone every call renders in unless it passes its own (ADR 0064: venue or organization). */
  timeZone: string;
  formats: DateTimeFormats;
};

type At = { instant: InstantLike; timeZone?: string };
type Span = { start: InstantLike; end: InstantLike; timeZone?: string };
type DateShape = { year?: boolean; weekday?: "short" | "long" };
type ClockShape = { zoneName?: boolean; seconds?: boolean };

/** Every way the UI writes a date or time (#481): one object per locale, zone and user. */
export type DateTimeFormat = {
  date: (input: At & DateShape) => string;
  time: (input: At & ClockShape) => string;
  /** The weekday alone (`Mon`), e.g. a column header: not a date, so no user format applies. */
  weekday: (input: At & { style: "short" | "long" }) => string;
  dateTime: (input: At & DateShape & ClockShape) => string;
  /** One date when both ends fall on the same day, else `start – end`. */
  dateRange: (input: Span & DateShape) => string;
  timeRange: (input: Span) => string;
  /** `27 Aug 2026, 14:00 – 16:00` on one day, else both ends in full. */
  dateTimeRange: (input: Span & DateShape) => string;
};

/** The formatter for one user: their date and clock formats, defaults where they chose none. */
export function createDateTimeFormat({
  locale,
  timeZone,
  formats,
}: CreateDateTimeFormatInput): DateTimeFormat {
  const dateFormat = formats.dateFormat ?? DEFAULT_DATE_FORMAT;
  const clockFormat = formats.clockFormat ?? DEFAULT_CLOCK_FORMAT;
  const joiner = namesMonth({ dateFormat }) ? ", " : " ";
  const at = ({ instant, timeZone: zone }: At) => ({
    locale,
    timeZone: zone ?? timeZone,
    instant: toInstant({ value: instant }),
  });
  const date: DateTimeFormat["date"] = ({ year, weekday, ...when }) =>
    formatDate({ ...at(when), dateFormat, year, weekday });
  const time: DateTimeFormat["time"] = ({ zoneName, seconds, ...when }) =>
    formatClock({ ...at(when), clockFormat, zoneName, seconds });
  const dateTime: DateTimeFormat["dateTime"] = ({ zoneName, seconds, ...input }) =>
    `${date(input)}${joiner}${time({ ...input, zoneName, seconds })}`;
  const sameDay = ({ start, end, timeZone: zone }: Span) =>
    date({ instant: start, timeZone: zone }) === date({ instant: end, timeZone: zone });
  return {
    date,
    time,
    weekday: ({ style, ...when }) => formatWeekday({ ...at(when), style }),
    dateTime,
    dateRange: ({ start, end, ...rest }) =>
      sameDay({ start, end, ...rest })
        ? date({ instant: start, ...rest })
        : `${date({ instant: start, ...rest })} – ${date({ instant: end, ...rest })}`,
    timeRange: ({ start, end, timeZone: zone }) =>
      `${time({ instant: start, timeZone: zone })} – ${time({ instant: end, timeZone: zone })}`,
    dateTimeRange: ({ start, end, ...rest }) =>
      sameDay({ start, end, ...rest })
        ? `${date({ instant: start, ...rest })}${joiner}${time({ instant: start, ...rest })} – ${time({ instant: end, ...rest })}`
        : `${dateTime({ instant: start, ...rest })} – ${dateTime({ instant: end, ...rest })}`,
  };
}
