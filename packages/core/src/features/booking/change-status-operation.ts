import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { applyCancellation } from "./cancellation";
import { checkPhaseRules } from "./phase-rules";
import { BookingChangeStatusInputSchema, BookingSchema } from "./schema";
import { loadBooking, toBookingDto } from "./to-booking-dto";

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

export const changeBookingStatus = defineOperation({
  name: "booking.changeStatus",
  kind: "command",
  description:
    "Move a booking to another of the organization's statuses (ADR 0022). Only transitions the " +
    "organization allows (bookingStatus.list transitionsTo); others give CONFLICT. The phase " +
    "rules always apply: CONFIRMED and COMPLETED need a coordinator (booking.assign), COMPLETED " +
    "only after the booking has ended, CANCELLED needs a reason and releases the booking's " +
    "occupancy.",
  input: BookingChangeStatusInputSchema,
  output: BookingSchema,
  permission: "booking:write",
  handler: async ({ input: { bookingId, statusId, reason }, context }) => {
    const before = await loadBooking({ context, id: bookingId });
    if (!before) return notFound({ entity: "Booking" });
    const status = await context.db.bookingStatus.findFirst({ where: { id: statusId } });
    if (!status) {
      const message = "Unknown or archived status";
      return invalid({ message, issues: [{ path: "statusId", message }] });
    }
    const now = new Date();
    for (const check of [
      await checkTransition({
        context,
        fromStatusId: before.bookingStatusId,
        toStatusId: statusId,
      }),
      checkPhaseRules({
        booking: before,
        phase: status.phase,
        statusName: status.name,
        reason,
        now,
      }),
    ]) {
      if (!check.ok) return check;
    }
    if (status.phase === "CANCELLED" && reason) {
      const cancelled = await applyCancellation({ context, booking: before, reason });
      if (!cancelled.ok) return cancelled;
    }
    const row = await context.db.booking.update({
      where: { id: bookingId },
      data: { bookingStatusId: statusId, statusChangedAt: now, statusReason: reason ?? null },
    });
    const booking = toBookingDto({ row });
    context.recordChange({ entityId: bookingId, before, after: booking });
    return ok({ value: booking });
  },
});
