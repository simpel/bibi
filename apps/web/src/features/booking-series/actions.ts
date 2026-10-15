"use server";

import {
  type BookingSeriesCreateInput,
  type BookingSeriesDto,
  createBookingSeries,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateBookingSeriesActionInput = { input: BookingSeriesCreateInput };

export async function createBookingSeriesAction({
  input,
}: CreateBookingSeriesActionInput): Promise<ActionResult<BookingSeriesDto>> {
  return toActionResult({ result: await runOperation({ operation: createBookingSeries, input }) });
}
