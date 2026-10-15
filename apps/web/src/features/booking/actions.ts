"use server";

import {
  assignBooking,
  type BookingAssignInput,
  type BookingChangeStatusInput,
  type BookingCreateInput,
  type BookingDto,
  type BookingUpdateInput,
  changeBookingStatus,
  createBooking,
  updateBooking,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateBookingActionInput = { input: BookingCreateInput };
export type UpdateBookingActionInput = { input: BookingUpdateInput };
export type AssignBookingActionInput = { input: BookingAssignInput };
export type ChangeBookingStatusActionInput = { input: BookingChangeStatusInput };

export async function createBookingAction({
  input,
}: CreateBookingActionInput): Promise<ActionResult<BookingDto>> {
  return toActionResult({ result: await runOperation({ operation: createBooking, input }) });
}

export async function updateBookingAction({
  input,
}: UpdateBookingActionInput): Promise<ActionResult<BookingDto>> {
  return toActionResult({ result: await runOperation({ operation: updateBooking, input }) });
}

export async function assignBookingAction({
  input,
}: AssignBookingActionInput): Promise<ActionResult<BookingDto>> {
  return toActionResult({ result: await runOperation({ operation: assignBooking, input }) });
}

export async function changeBookingStatusAction({
  input,
}: ChangeBookingStatusActionInput): Promise<ActionResult<BookingDto>> {
  return toActionResult({ result: await runOperation({ operation: changeBookingStatus, input }) });
}
