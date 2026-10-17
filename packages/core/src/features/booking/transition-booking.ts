import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { BookingPhase } from "../booking-status/schema";
import { applyCancellation } from "./cancellation";
import { checkPhaseRules } from "./phase-rules";
import type { BookingDto } from "./schema";
import { toBookingDto } from "./to-booking-dto";

type TransitionInput = { context: OperationContext; fromStatusId: string; toStatusId: string };

/** The organization must allow the transition (`BookingStatusTransition`, from → to). */
async function checkTransition({
  context,
  fromStatusId,
  toStatusId,
}: TransitionInput): Promise<Result<true>> {
  const allowed = await context.db.bookingStatusTransition.count({
    where: { fromStatusId, toStatusId },
  });
  if (allowed > 0) return ok({ value: true });
  return conflict({ message: "The organization does not allow this status change" });
}

export type TransitionBookingInput = {
  context: OperationContext;
  /** The booking as it is before the change. */
  before: BookingDto;
  status: { id: string; name: string; phase: BookingPhase };
  reason?: string | undefined;
  now: Date;
};

/**
 * Moves one booking to a status (ADR 0022): the organization's transition, the fixed phase rules
 * and, for the `CANCELLED` phase, the cancellation (released occupancy and hooks). Audited.
 * Shared by `booking.changeStatus` and `bookingSeries.cancel`.
 */
export async function transitionBooking({
  context,
  before,
  status,
  reason,
  now,
}: TransitionBookingInput): Promise<Result<BookingDto>> {
  const fromStatusId = before.bookingStatusId;
  const from = await context.db.bookingStatus.findFirst({ where: { id: fromStatusId } });
  if (from?.phase === "CANCELLED") {
    return conflict({ message: "A cancelled booking cannot be moved to another status" });
  }
  const allowed = await checkTransition({ context, fromStatusId, toStatusId: status.id });
  if (!allowed.ok) return allowed;
  const { phase, name: statusName } = status;
  const rules = checkPhaseRules({ booking: before, phase, statusName, reason, now });
  if (!rules.ok) return rules;
  if (phase === "CANCELLED" && reason) {
    const cancelled = await applyCancellation({ context, booking: before, reason });
    if (!cancelled.ok) return cancelled;
  }
  const row = await context.db.booking.update({
    where: { id: before.id },
    data: { bookingStatusId: status.id, statusChangedAt: now, statusReason: reason ?? null },
  });
  const booking = toBookingDto({ row });
  context.recordChange({ entityType: "booking", entityId: before.id, before, after: booking });
  return ok({ value: booking });
}
