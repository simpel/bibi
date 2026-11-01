import { calendarLocales } from "@bibi/ui";
import { useLocale, useTranslations } from "next-intl";
import { plainDayText } from "@/lib/time/plain-day";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";

/** What every date button needs: the user's date format, the calendar's language and the words. */
export function useDatePicker() {
  const t = useTranslations("common.datePicker");
  const locale = useLocale();
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  const formatDay = ({ day }: { day: string }) =>
    day ? plainDayText({ day, timeZone, dates }) : "";
  return {
    t,
    formatDay,
    formatSpan: ({ from, to }: { from: string; to: string }) =>
      from === to
        ? formatDay({ day: from })
        : `${formatDay({ day: from })} – ${formatDay({ day: to })}`,
    calendar: {
      locale: locale === "sv" ? calendarLocales.sv : calendarLocales.en,
      weekStartsOn: 1,
    } as const,
  };
}
