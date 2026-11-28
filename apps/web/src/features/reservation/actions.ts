"use server";

import {
  cancelReservation,
  completeReservation,
  createReservation,
  createTableBlock,
  deleteTableBlock,
  getItem,
  markReservationNoShow,
  reservationAvailability,
  reservationCalendar,
  revertReservationNoShow,
  seatReservation,
  unseatReservation,
  updateReservation,
} from "@bibi/core";
import type {
  ReservationAvailabilityOutputSchema,
  ReservationCalendarOutputSchema,
  ReservationCreateInput,
  ReservationDto,
  ReservationUpdateInput,
  ReservationWithWarningsSchema,
  TableBlockDto,
} from "@bibi/core/schemas";
import type { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { atTime } from "../table-booking/lib/edge-time";
import type { BlockActionInput } from "./lib/block-form";

export type ReservationWithWarnings = z.infer<typeof ReservationWithWarningsSchema>;
export type AvailabilityOutput = z.infer<typeof ReservationAvailabilityOutputSchema>;

export type GuestCalendarActionInput = { roomItemId: string; month: string; partySize: number };
export type GuestCalendarOutput = z.infer<typeof ReservationCalendarOutputSchema>;

/** A month as a guest meets it (the guest rules applied), for the room's setup page. */
export async function guestCalendarAction({
  roomItemId,
  month,
  partySize,
}: GuestCalendarActionInput): Promise<ActionResult<GuestCalendarOutput>> {
  return toActionResult({
    result: await runOperation({
      operation: reservationCalendar,
      input: { roomItemId, month, partySize },
    }),
  });
}

export type StateAction = "seat" | "unseat" | "complete" | "markNoShow" | "revertNoShow";

const STATE_OPERATIONS = {
  seat: seatReservation,
  unseat: unseatReservation,
  complete: completeReservation,
  markNoShow: markReservationNoShow,
  revertNoShow: revertReservationNoShow,
} as const;

/** Seat, undo seating, complete, mark as no-show or undo a no-show. */
export async function reservationStateAction({
  id,
  action,
}: {
  id: string;
  action: StateAction;
}): Promise<ActionResult<ReservationDto>> {
  const operation = STATE_OPERATIONS[action];
  return toActionResult({ result: await runOperation({ operation, input: { id } }) });
}

export async function cancelReservationAction({
  id,
}: {
  id: string;
}): Promise<ActionResult<ReservationDto>> {
  return toActionResult({
    result: await runOperation({ operation: cancelReservation, input: { id } }),
  });
}

export async function createReservationAction({
  input,
}: {
  input: ReservationCreateInput;
}): Promise<ActionResult<ReservationWithWarnings>> {
  return toActionResult({ result: await runOperation({ operation: createReservation, input }) });
}

export async function updateReservationAction({
  input,
}: {
  input: ReservationUpdateInput;
}): Promise<ActionResult<ReservationWithWarnings>> {
  return toActionResult({ result: await runOperation({ operation: updateReservation, input }) });
}

export type AvailabilityActionInput = { roomItemId: string; date: string; partySize: number };

/** Staff mode: the guest rules are not applied (`online: false`). */
export async function availabilityAction({
  roomItemId,
  date,
  partySize,
}: AvailabilityActionInput): Promise<ActionResult<AvailabilityOutput>> {
  const input = { roomItemId, date, partySize, online: false };
  return toActionResult({
    result: await runOperation({ operation: reservationAvailability, input }),
  });
}

/** Blocks tables for a period given as local days and times, read in the room's zone. */
export async function createBlockAction({
  input,
}: {
  input: BlockActionInput;
}): Promise<ActionResult<{ items: TableBlockDto[] }>> {
  const item = await runOperation({ operation: getItem, input: { id: input.roomItemId } });
  if (!item.ok) return toActionResult({ result: item });
  const timeZone = item.value.timeZone;
  const { roomItemId: _room, startDay, endDay, startTime, endTime, ...rest } = input;
  const blocked = {
    ...rest,
    startsAt: atTime({ day: startDay, time: startTime, timeZone }),
    endsAt: atTime({ day: endDay, time: endTime, timeZone }),
  };
  return toActionResult({
    result: await runOperation({ operation: createTableBlock, input: blocked }),
  });
}

export async function deleteBlockAction({
  id,
}: {
  id: string;
}): Promise<ActionResult<TableBlockDto>> {
  return toActionResult({
    result: await runOperation({ operation: deleteTableBlock, input: { id } }),
  });
}

export type RescheduleActionInput = {
  id: string;
  roomItemId: string;
  /** The local day and `HH:mm` in the room's zone. */
  date: string;
  time: string;
  partySize: number;
  durationMinutes: number;
  /** Only when the tables were changed by hand; none = find tables again for the new time. */
  tableIds?: string[] | undefined;
};

/** Moves a reservation: the local day and time become an instant in the room's zone (ADR 0064). */
export async function rescheduleReservationAction({
  roomItemId,
  date,
  time,
  ...rest
}: RescheduleActionInput): Promise<ActionResult<ReservationWithWarnings>> {
  const item = await runOperation({ operation: getItem, input: { id: roomItemId } });
  if (!item.ok) return toActionResult({ result: item });
  const startsAt = atTime({ day: date, time, timeZone: item.value.timeZone });
  return toActionResult({
    result: await runOperation({ operation: updateReservation, input: { ...rest, startsAt } }),
  });
}
