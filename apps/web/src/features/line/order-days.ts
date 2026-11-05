import "server-only";
import { type CalendarBlockDto, calendarRange, type LineDto } from "@bibi/core";
import { addDays, fromZonedParts, parseIsoDate, toIsoDate, toZonedParts } from "@bibi/core/schemas";
import type { DaySnapshotRow } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import { dayLabels } from "./ui/order-day-labels";
import { orderDayOf } from "./ui/order-day-model";
import type { ProgramFormData } from "./ui/program-form-data";

/** At most this many days get a snapshot; a longer order opens the calendar for the rest. */
const MAX_DAYS = 7;

/** One of the order's days in the calendar, ready to draw. */
export type OrderDaySnapshot = {
  day: string;
  /** The day as the caller reads it, e.g. "Tue 4 Nov". */
  date: string;
  startMinute: number;
  endMinute: number;
  rows: DaySnapshotRow[];
};

export type OrderDays = { days: OrderDaySnapshot[]; untimed: string[] };

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

/** Every booking those days (`calendar.range`); none when it may not be read. */
async function loadBlocks({ days }: { days: string[] }): Promise<CalendarBlockDto[]> {
  const [from, last] = [days[0], days[days.length - 1]];
  if (!from || !last) return [];
  const to = toIsoDate({ date: addDays({ date: parseIsoDate({ value: last }), days: 1 }) });
  const result = await runOperation({ operation: calendarRange, input: { from, to } });
  return result.ok ? result.value.blocks : [];
}

export type LoadOrderDaysInput = {
  orderId: string;
  orderReference?: number | null;
  customerName?: string | null;
  lines: LineDto[];
  data: ProgramFormData;
};

/**
 * The order's days in the calendar: per day, everything booked in the organization, the other
 * orders' dimmed and this order's lines solid (the intake's snapshot, ADR 0081). None when the
 * caller may not view items or no line has a time.
 */
export async function loadOrderDays({
  orderId,
  orderReference,
  customerName,
  lines,
  data,
}: LoadOrderDaysInput): Promise<OrderDays> {
  const { timeZone } = data;
  const days = data.itemsHidden ? [] : daysOf({ lines, timeZone });
  if (days.length === 0) return { days: [], untimed: [] };
  const itemNames = new Map(data.items.map(({ id, name }) => [id, name]));
  const itemGroups = new Map(data.items.map(({ id, typeName }) => [id, typeName ?? ""]));
  const stateMap = new Map(data.states.map((s) => [s.id, { name: s.name, color: s.color }]));
  const [t, format, blocks] = await Promise.all([
    getTranslations("line.day"),
    getDateTimeFormat(),
    loadBlocks({ days }),
  ]);
  const { blockLabel } = dayLabels({ t });
  const timeFormatter = ({ start, end, timeZone }: { start: Date; end: Date; timeZone?: string }) =>
    format.timeRange({ start, end, timeZone });
  let untimed: string[] = [];
  const snapshots = days.map((day, index) => {
    const midnight = fromZonedParts({
      ...{ date: parseIsoDate({ value: day }), time: { hour: 0, minute: 0, second: 0 } },
      timeZone,
    });
    const date = format.date({ instant: midnight, timeZone, weekday: "short" });
    const { untimed: loose, ...snapshot } = orderDayOf({
      ...{
        orderId,
        orderReference,
        customerName,
        date,
        lines,
        blocks,
        midnight,
        itemNames,
        itemGroups,
        stateMap,
        timeFormatter,
        blockLabel,
      },
      otherLabel: t("otherLines"),
      ...(index === 0 ? { missingLabel: t("missingTime") } : {}),
    });
    if (index === 0) untimed = loose;
    return { day, date, ...snapshot };
  });
  return { days: snapshots, untimed };
}
