"use server";

import {
  archiveBookingStatus,
  type BookingStatusCreateInput,
  type BookingStatusDto,
  type BookingStatusImportResult,
  type BookingStatusUpdateInput,
  createBookingStatus,
  importBookingStatusTemplate,
  reorderBookingStatuses,
  setBookingStatusTransitions,
  updateBookingStatus,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateBookingStatusActionInput = { input: BookingStatusCreateInput };
export type UpdateBookingStatusActionInput = { input: BookingStatusUpdateInput };
export type BookingStatusIdActionInput = { id: string };
export type ReorderBookingStatusesActionInput = { ids: string[] };
export type SetTransitionsActionInput = { input: { id: string; toStatusIds: string[] } };
type StatusPage = { items: BookingStatusDto[]; nextCursor: string | null };

export async function createBookingStatusAction({
  input,
}: CreateBookingStatusActionInput): Promise<ActionResult<BookingStatusDto>> {
  return toActionResult({ result: await runOperation({ operation: createBookingStatus, input }) });
}

export async function updateBookingStatusAction({
  input,
}: UpdateBookingStatusActionInput): Promise<ActionResult<BookingStatusDto>> {
  return toActionResult({ result: await runOperation({ operation: updateBookingStatus, input }) });
}

export async function archiveBookingStatusAction({
  id,
}: BookingStatusIdActionInput): Promise<ActionResult<BookingStatusDto>> {
  const result = await runOperation({ operation: archiveBookingStatus, input: { id } });
  return toActionResult({ result });
}

export async function reorderBookingStatusesAction({
  ids,
}: ReorderBookingStatusesActionInput): Promise<ActionResult<StatusPage>> {
  const result = await runOperation({ operation: reorderBookingStatuses, input: { ids } });
  return toActionResult({ result });
}

export async function setBookingStatusTransitionsAction({
  input,
}: SetTransitionsActionInput): Promise<ActionResult<BookingStatusDto>> {
  const result = await runOperation({ operation: setBookingStatusTransitions, input });
  return toActionResult({ result });
}

/** Imports the "Conference venue" statuses; names that already exist are skipped. */
export async function importBookingStatusTemplateAction(): Promise<
  ActionResult<BookingStatusImportResult>
> {
  const input = { template: "conference-venue" as const };
  const result = await runOperation({ operation: importBookingStatusTemplate, input });
  return toActionResult({ result });
}
