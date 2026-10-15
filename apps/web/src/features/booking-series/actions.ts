"use server";

import {
  type BookingSeriesCancelInput,
  type BookingSeriesCreateInput,
  type BookingSeriesDto,
  type BookingSeriesUpdateOccurrencesInput,
  cancelBookingSeries,
  createBookingSeries,
  updateBookingSeriesOccurrences,
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

export type UpdateOccurrencesActionInput = { input: BookingSeriesUpdateOccurrencesInput };

export async function updateOccurrencesAction({
  input,
}: UpdateOccurrencesActionInput): Promise<ActionResult<BookingSeriesDto>> {
  const operation = updateBookingSeriesOccurrences;
  return toActionResult({ result: await runOperation({ operation, input }) });
}

export type CancelBookingSeriesActionInput = { input: BookingSeriesCancelInput };

export async function cancelBookingSeriesAction({
  input,
}: CancelBookingSeriesActionInput): Promise<ActionResult<BookingSeriesDto>> {
  return toActionResult({ result: await runOperation({ operation: cancelBookingSeries, input }) });
}
