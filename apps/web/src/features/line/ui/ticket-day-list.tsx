import { DaySnapshot } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { TicketDays } from "../ticket-days";

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/**
 * The ticket's days in the calendar, one snapshot each, and its lines without a time under the
 * first. Drawn on the ticket page and in the ticket sheet alike.
 */
export function TicketDayList({ days, untimed }: TicketDays) {
  const t = useTranslations("line.day");
  const hourLabel = ({ hour }: { hour: number }) =>
    hour >= 24 ? t("nextDay", { hour: pad({ value: hour - 24 }) }) : pad({ value: hour });
  return days.map(({ day, date, ...snapshot }, index) => (
    <section key={day} className="grid grid-cols-1 gap-2" aria-label={t("title", { date })}>
      <h3 className="text-sm text-muted-foreground">{t("title", { date })}</h3>
      <DaySnapshot {...snapshot} hourLabel={hourLabel} />
      {index === 0 && untimed.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("untimed", { lines: untimed.join(", ") })}
        </p>
      ) : null}
    </section>
  ));
}
