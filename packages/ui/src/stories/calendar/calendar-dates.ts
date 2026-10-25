/**
 * Plain date keys, "YYYY-MM-DD" (ADR 0064: a code-level key, never a column). Arithmetic runs on
 * UTC midnights so a key never shifts with the browser's zone; the venue's zone made the key.
 */

/** The stories' "today": the busy Thursday at Lindholmen. */
export const STORY_DAY = "2026-11-12";

const DAY_MS = 86_400_000;

const toUtc = ({ date }: { date: string }) => Date.parse(`${date}T00:00:00Z`);

export function addDays({ date, days }: { date: string; days: number }): string {
  return new Date(toUtc({ date }) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween({ from, to }: { from: string; to: string }): number {
  return Math.round((toUtc({ date: to }) - toUtc({ date: from })) / DAY_MS);
}

/** 0 Monday … 6 Sunday. */
export function weekdayOf({ date }: { date: string }): number {
  return (new Date(toUtc({ date })).getUTCDay() + 6) % 7;
}

export function startOfWeek({ date }: { date: string }): string {
  return addDays({ date, days: -weekdayOf({ date }) });
}

export function startOfMonth({ date }: { date: string }): string {
  return `${date.slice(0, 8)}01`;
}

export function daysInMonth({ date }: { date: string }): number {
  const next = addDays({ date: startOfMonth({ date }), days: 32 });
  return daysBetween({ from: startOfMonth({ date }), to: startOfMonth({ date: next }) });
}

/** ISO 8601 week number: the week holding the year's first Thursday is week 1. */
export function isoWeek({ date }: { date: string }): number {
  const thursday = addDays({ date, days: 3 - weekdayOf({ date }) });
  const january4 = `${thursday.slice(0, 4)}-01-04`;
  return Math.floor(daysBetween({ from: startOfWeek({ date: january4 }), to: thursday }) / 7) + 1;
}

/** "Thu 12 Nov", or any other Intl parts; the key is read as a calendar date, not an instant. */
export function formatDate({
  date,
  locale,
  options,
}: {
  date: string;
  locale: string;
  options: Intl.DateTimeFormatOptions;
}): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(toUtc({ date }));
}

/**
 * The user's date formatter: the shape of core's `DateTimeFormat["date"]`, so the app passes
 * `useDateTimeFormat().date` as is and every date follows the user's own format (#481).
 */
export type FormatDate = (input: {
  instant: Date;
  timeZone?: string;
  year?: boolean;
  weekday?: "short" | "long";
}) => string;

/** A day key as an instant the formatter can read: noon UTC, rendered in UTC, never shifts. */
export function formatDay({
  date,
  format,
  year = false,
}: {
  date: string;
  format: FormatDate;
  year?: boolean;
}): string {
  return format({
    instant: new Date(`${date}T12:00:00Z`),
    timeZone: "UTC",
    year,
    weekday: "short",
  });
}

/** "Thu 12 Nov 2026", or both ends in full, as core's `dateRange` writes a span. */
export function formatDays({ from, to, format }: { from: string; to: string; format: FormatDate }) {
  const day = ({ date }: { date: string }) => formatDay({ date, format, year: true });
  return from === to ? day({ date: from }) : `${day({ date: from })} – ${day({ date: to })}`;
}

/**
 * The stories' stand-in for the user's formatter: the default format, `D_MMM_YYYY`
 * ("Thu 12 Nov 2026"). The app passes the real one.
 */
export function storyFormatDate({ locale }: { locale: string }): FormatDate {
  return ({ instant, timeZone, year = true, weekday }) =>
    new Intl.DateTimeFormat(locale, {
      timeZone,
      day: "numeric",
      month: "short",
      ...(year ? { year: "numeric" } : {}),
      ...(weekday ? { weekday } : {}),
    })
      .format(instant)
      .replace(",", "");
}
