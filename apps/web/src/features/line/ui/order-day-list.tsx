import { cn, DaySnapshot } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { OrderDays } from "../order-days";

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/**
 * The order's days in the calendar, one snapshot each, and its lines without a time under the
 * first. Drawn on the order page and in the order sheet alike.
 */
export function OrderDayList({ days, untimed, joined = false }: OrderDays & { joined?: boolean }) {
  const t = useTranslations("line.day");
  const hourLabel = ({ hour }: { hour: number }) =>
    hour >= 24 ? t("nextDay", { hour: pad({ value: hour - 24 }) }) : pad({ value: hour });
  return days.map(({ day, date, ...snapshot }, index) => (
    <section
      key={day}
      className={cn("grid grid-cols-1 gap-2", joined && "p-4", joined && index > 0 && "border-t")}
      aria-label={t("title", { date })}
    >
      <h3 className="text-sm text-muted-foreground">{t("title", { date })}</h3>
      <DaySnapshot
        {...snapshot}
        hourLabel={hourLabel}
        className={joined ? "rounded-none border-0 p-0" : undefined}
      />
      {index === 0 && untimed.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("untimed", { lines: untimed.join(", ") })}
        </p>
      ) : null}
    </section>
  ));
}
