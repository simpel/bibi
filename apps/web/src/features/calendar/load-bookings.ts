import "server-only";
import {
  type CalendarBlockDto,
  type CalendarRange,
  type CalendarTask,
  calendarRange,
  ok,
  type Result,
} from "@bibi/core";
import { addDays, MAX_CALENDAR_DAYS, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import type { AssetBooking, CalendarDayValue, CalendarTaskEntry } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { orderRoute, taskRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { toAssetBookings } from "./to-asset-bookings";
import { toCalendarTasks } from "./to-calendar-tasks";

/** The most days one load may ask for: the timeline loads 28 at a time, three at the start. */
export const MAX_LOAD_DAYS = MAX_CALENDAR_DAYS * 3;

export type DayRange = { from: string; to: string };

/** The calendar's bookings and tasks (ADR 0117) of some days, and what each item's day is worth. */
export type CalendarLoad = {
  bookings: AssetBooking[];
  values: CalendarDayValue[];
  tasks: CalendarTaskEntry[];
};

/** Day values in whole units, as the calendar shows money (`Money`). */
const toValues = ({ range }: { range: CalendarRange }): CalendarDayValue[] =>
  range.values.map((value) => {
    const units = ({ minor }: { minor: number | null }) => (minor === null ? null : minor / 100);
    return {
      assetId: value.itemId,
      date: value.date,
      booked: units({ minor: value.bookedMinor }),
      prebooked: units({ minor: value.prebookedMinor }),
      open: units({ minor: value.openMinor }),
      currency: range.currency,
    };
  });

/** `[from, to]` cut into the longest ranges one `calendar.range` call may cover. */
export function chunksOf({ from, to }: DayRange): DayRange[] {
  const chunks: DayRange[] = [];
  let start = parseIsoDate({ value: from });
  const last = parseIsoDate({ value: to });
  for (let count = 0; toIsoDate({ date: start }) <= to && count < 3; count++) {
    const end = addDays({ date: start, days: MAX_CALENDAR_DAYS - 1 });
    const capped = toIsoDate({ date: end }) < to ? end : last;
    chunks.push({ from: toIsoDate({ date: start }), to: toIsoDate({ date: capped }) });
    start = addDays({ date: capped, days: 1 });
  }
  return chunks;
}

/**
 * Every block and task of the days, once each: one over a chunk's edge comes back in both. The
 * chunks' days never overlap, so their values simply add up.
 */
async function loadBlocks({ range }: { range: DayRange }) {
  const results = await Promise.all(
    chunksOf(range).map((chunk) => runOperation({ operation: calendarRange, input: chunk })),
  );
  const blocks = new Map<string, CalendarBlockDto>();
  const tasks = new Map<string, CalendarTask>();
  const values: CalendarDayValue[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    for (const block of result.value.blocks) blocks.set(block.id, block);
    for (const task of result.value.tasks) tasks.set(task.id, task);
    values.push(...toValues({ range: result.value }));
  }
  return ok({ value: { blocks: [...blocks.values()], tasks: [...tasks.values()], values } });
}

/**
 * The calendar's bookings for `from` to `to` (inclusive, at most `MAX_LOAD_DAYS`), in the
 * organization's zone (ADR 0064 decision 12: all venues show in the organization's zone).
 */
export async function loadBookings({ range }: { range: DayRange }): Promise<Result<CalendarLoad>> {
  const [blocks, timeZone, t, dates] = await Promise.all([
    loadBlocks({ range }),
    loadOrganizationTimeZone(),
    getTranslations("calendar"),
    getDateTimeFormat(),
  ]);
  if (!blocks.ok) return blocks;
  const bookings = toAssetBookings({
    blocks: blocks.value.blocks,
    timeZone,
    blocked: { name: t("blocked"), color: "var(--input)", ink: "var(--foreground)", hold: "hard" },
    unnamed: {
      name: t("booked"),
      color: "var(--primary)",
      ink: "var(--primary-foreground)",
      hold: "hard",
    },
    via: { LINE: t("viaLine"), ORDER: t("viaOrder") },
    orderHref: ({ orderId }) => orderRoute({ id: orderId }),
    taskStates: {
      soft: {
        name: t("taskPrebook"),
        color: "var(--task)",
        ink: "var(--foreground)",
        hold: "soft",
      },
      hard: { name: t("taskBook"), color: "var(--task)", ink: "var(--foreground)", hold: "hard" },
    },
    taskHref: ({ taskId }) => taskRoute({ id: taskId }),
  });
  const tasks = toCalendarTasks({
    tasks: blocks.value.tasks,
    timeZone,
    dates,
    taskHref: ({ id }) => taskRoute({ id }),
  });
  return ok({ value: { bookings, values: blocks.value.values, tasks } });
}
