import { type CalendarBlockDto, calendarRange, type LineDto } from "@bibi/core";
import { addDays, fromZonedParts, parseIsoDate, toIsoDate, toZonedParts } from "@bibi/core/schemas";
import { DaySnapshot } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import type { ProgramFormData } from "./program-form-data";
import { dayLabels } from "./ticket-day-labels";
import { ticketDayOf } from "./ticket-day-model";

/** At most this many days get a snapshot; a longer ticket opens the calendar for the rest. */
const MAX_DAYS = 7;

/** The days (YYYY-MM-DD, in the zone) the timed lines touch, in order. */
function daysOf({ lines, timeZone }: { lines: readonly LineDto[]; timeZone: string }) {
  const days = lines.flatMap(({ startsAt, endsAt }) =>
    startsAt && endsAt
      ? [startsAt, new Date(endsAt.getTime() - 1)].map((instant) =>
          toIsoDate({ date: toZonedParts({ instant, timeZone }).date }),
        )
      : [],
  );
  return [...new Set(days)].sort().slice(0, MAX_DAYS);
}

export type TicketDayProps = { ticketId: string; lines: LineDto[]; data: ProgramFormData };

/** Every booking those days (`calendar.range`); none when it may not be read. */
async function loadBlocks({ days }: { days: string[] }): Promise<CalendarBlockDto[]> {
  const [from, last] = [days[0], days[days.length - 1]];
  if (!from || !last) return [];
  const to = toIsoDate({ date: addDays({ date: parseIsoDate({ value: last }), days: 1 }) });
  const result = await runOperation({ operation: calendarRange, input: { from, to } });
  return result.ok ? result.value.blocks : [];
}

/**
 * The ticket's days in the calendar: per day, everything booked in the organization, the other
 * tickets' dimmed and this ticket's lines solid (the intake's snapshot, ADR 0081).
 */
export async function TicketDay({ ticketId, lines, data }: TicketDayProps) {
  if (data.itemsHidden) return null;
  const { timeZone } = data;
  const days = daysOf({ lines, timeZone });
  if (days.length === 0) return null;
  const itemNames = new Map(data.items.map(({ id, name }) => [id, name]));
  const [t, format, blocks] = await Promise.all([
    getTranslations("line.day"),
    getDateTimeFormat(),
    loadBlocks({ days }),
  ]);
  const { hourLabel, blockLabel } = dayLabels({ t });
  return days.map((day, index) => {
    const midnight = fromZonedParts({
      ...{ date: parseIsoDate({ value: day }), time: { hour: 0, minute: 0, second: 0 } },
      timeZone,
    });
    const { untimed, ...snapshot } = ticketDayOf({
      ...{ ticketId, lines, blocks, midnight, itemNames, blockLabel },
      otherLabel: t("otherLines"),
    });
    const date = format.date({ instant: midnight, timeZone, weekday: "short" });
    return (
      <section key={day} className="grid grid-cols-1 gap-2" aria-label={t("title", { date })}>
        <h3 className="text-sm text-muted-foreground">{t("title", { date })}</h3>
        <DaySnapshot {...snapshot} hourLabel={hourLabel} />
        {index === 0 && untimed.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("untimed", { lines: untimed.join(", ") })}
          </p>
        ) : null}
      </section>
    );
  });
}
