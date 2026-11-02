"use server";

import { AppError, type CalendarBlockDto, calendarRange, err } from "@bibi/core";
import { PlainDateStringSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { type CalendarLoad, type DayRange, loadBookings } from "./load-bookings";

const RangeSchema = z
  .object({ from: PlainDateStringSchema, to: PlainDateStringSchema })
  .refine(({ from, to }) => from <= to);

/** More days for the timeline as it scrolls: bookings and values of `from` to `to`, inclusive. */
export async function loadCalendarBookingsAction({
  from,
  to,
}: DayRange): Promise<ActionResult<CalendarLoad>> {
  const parsed = RangeSchema.safeParse({ from, to });
  if (!parsed.success) {
    const error = new AppError({ code: "VALIDATION", message: "Invalid calendar range" });
    return toActionResult({ result: err({ error }) });
  }
  return toActionResult({ result: await loadBookings({ range: parsed.data }) });
}

export type LoadItemBlocksActionInput = { from: string; to: string; itemIds: string[] };

/**
 * Other bookings of some items on some days (`calendar.range` with `itemIds`, ADR 0081): the
 * intake's calendar snapshot of the resources its draft lines use.
 */
export async function loadItemBlocksAction({
  from,
  to,
  itemIds,
}: LoadItemBlocksActionInput): Promise<ActionResult<CalendarBlockDto[]>> {
  const result = await runOperation({ operation: calendarRange, input: { from, to, itemIds } });
  return toActionResult({ result: result.ok ? { ok: true, value: result.value.blocks } : result });
}
