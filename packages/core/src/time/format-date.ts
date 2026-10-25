import type { DateFormat } from "./display-formats";
import { intlParts } from "./intl-parts";

export type DateParts = { locale: string; timeZone: string; instant: Date };

export type FormatDateInput = DateParts & {
  dateFormat: DateFormat;
  /** Leave out the year, e.g. a calendar column header. Default: with year. */
  year?: boolean;
  /** Put the weekday first, e.g. `Mon 27 Aug 2026`. */
  weekday?: "short" | "long";
};

const MONTH_STYLE: Record<DateFormat, "short" | "long" | "2-digit"> = {
  D_MMM_YYYY: "short",
  D_MMMM_YYYY: "long",
  YYYY_MM_DD: "2-digit",
  DD_MM_YYYY: "2-digit",
  MM_DD_YYYY: "2-digit",
};

type Fields = { day: string; month: string; year: string | null };

const PATTERNS: Record<DateFormat, (fields: Fields) => string> = {
  D_MMM_YYYY: ({ day, month, year }) => [day, month, year].filter(Boolean).join(" "),
  D_MMMM_YYYY: ({ day, month, year }) => [day, month, year].filter(Boolean).join(" "),
  YYYY_MM_DD: ({ day, month, year }) => [year, month, day].filter(Boolean).join("-"),
  DD_MM_YYYY: ({ day, month, year }) => [day, month, year].filter(Boolean).join("/"),
  MM_DD_YYYY: ({ day, month, year }) => [month, day, year].filter(Boolean).join("/"),
};

/** True for the patterns that spell the month out (`27 Aug 2026`), false for numeric ones. */
export const namesMonth = ({ dateFormat }: { dateFormat: DateFormat }): boolean =>
  MONTH_STYLE[dateFormat] !== "2-digit";

/**
 * `instant` as a date in `timeZone`, in the user's pattern with the locale's month and weekday
 * names. Built from `formatToParts`, because Intl alone cannot give `27 Aug 2026` in English.
 */
export function formatDate({ dateFormat, year = true, weekday, ...at }: FormatDateInput): string {
  const numeric = !namesMonth({ dateFormat });
  const parts = intlParts({
    ...at,
    options: {
      day: numeric ? "2-digit" : "numeric",
      month: MONTH_STYLE[dateFormat],
      year: "numeric",
      ...(weekday ? { weekday } : {}),
    },
  });
  const date = PATTERNS[dateFormat]({
    day: parts.day ?? "",
    month: parts.month ?? "",
    year: year ? (parts.year ?? "") : null,
  });
  return weekday ? `${parts.weekday ?? ""} ${date}` : date;
}

export type FormatWeekdayInput = DateParts & { style: "short" | "long" };

/** The weekday's name alone, e.g. a calendar column header (`Mon`, `mån`). */
export function formatWeekday({ style, ...at }: FormatWeekdayInput): string {
  return intlParts({ ...at, options: { weekday: style } }).weekday ?? "";
}
