import type { FormatDate } from "../../components/availability-calendar/calendar-dates";

/** The stories' "today": the busy Thursday at Lindholmen. */
export const STORY_DAY = "2026-11-12";

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
