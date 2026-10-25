import "server-only";
import { type CalendarBlockDto, calendarRange, ok, type Result } from "@bibi/core";
import { addDays, MAX_CALENDAR_DAYS, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import type { AssetBooking } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ticketRoute } from "@/lib/routes";
import { runOperation } from "@/server/run-operation";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { toAssetBookings } from "./to-asset-bookings";

/** The most days one load may ask for: the timeline loads 28 at a time, three at the start. */
export const MAX_LOAD_DAYS = MAX_CALENDAR_DAYS * 3;

export type DayRange = { from: string; to: string };

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

/** Every block of the days, once each: a block over a chunk's edge comes back in both. */
async function loadBlocks({ range }: { range: DayRange }): Promise<Result<CalendarBlockDto[]>> {
  const results = await Promise.all(
    chunksOf(range).map((chunk) => runOperation({ operation: calendarRange, input: chunk })),
  );
  const blocks = new Map<string, CalendarBlockDto>();
  for (const result of results) {
    if (!result.ok) return result;
    for (const block of result.value.blocks) blocks.set(block.id, block);
  }
  return ok({ value: [...blocks.values()] });
}

/**
 * The calendar's bookings for `from` to `to` (inclusive, at most `MAX_LOAD_DAYS`), in the
 * organization's zone (ADR 0064 decision 12: all venues show in the organization's zone).
 */
export async function loadBookings({
  range,
}: {
  range: DayRange;
}): Promise<Result<AssetBooking[]>> {
  const [blocks, timeZone, t] = await Promise.all([
    loadBlocks({ range }),
    loadOrganizationTimeZone(),
    getTranslations("calendar"),
  ]);
  if (!blocks.ok) return blocks;
  const bookings = toAssetBookings({
    blocks: blocks.value,
    timeZone,
    blocked: { name: t("blocked"), color: "var(--input)", ink: "var(--foreground)", hold: "hard" },
    unnamed: {
      name: t("booked"),
      color: "var(--primary)",
      ink: "var(--primary-foreground)",
      hold: "hard",
    },
    via: { LINE: t("viaLine"), TICKET: t("viaTicket") },
    ticketHref: ({ ticketId }) => ticketRoute({ id: ticketId }),
  });
  return ok({ value: bookings });
}
