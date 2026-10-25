import {
  CLOCK_FORMATS,
  type ClockFormat,
  createDateTimeFormat,
  DATE_FORMATS,
  type DateFormat,
  DEFAULT_CLOCK_FORMAT,
  DEFAULT_DATE_FORMAT,
} from "@bibi/core/schemas";

/** A fixed sample instant for the live examples (27 Aug 2026, 14:30 in Stockholm). */
const SAMPLE = new Date("2026-08-27T12:30:00Z");

export type FormatOption<V extends string> = { value: V; example: string; isDefault: boolean };

export type FormatOptionsInput = { locale: string; timeZone: string };

/** One option per date format, each rendered in that format. */
export function dateFormatOptions({ locale, timeZone }: FormatOptionsInput) {
  return DATE_FORMATS.map((dateFormat): FormatOption<DateFormat> => {
    const format = createDateTimeFormat({
      locale,
      timeZone,
      formats: { dateFormat, clockFormat: null },
    });
    return {
      value: dateFormat,
      example: format.date({ instant: SAMPLE }),
      isDefault: dateFormat === DEFAULT_DATE_FORMAT,
    };
  });
}

/** One option per clock format, each rendered in that format. */
export function clockFormatOptions({ locale, timeZone }: FormatOptionsInput) {
  return CLOCK_FORMATS.map((clockFormat): FormatOption<ClockFormat> => {
    const format = createDateTimeFormat({
      locale,
      timeZone,
      formats: { dateFormat: null, clockFormat },
    });
    return {
      value: clockFormat,
      example: format.time({ instant: SAMPLE }),
      isDefault: clockFormat === DEFAULT_CLOCK_FORMAT,
    };
  });
}
