import type { Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { firstStatusIdOfPhase } from "./booking-defaults";
import type { BookingDto } from "./schema";
import { transitionBooking } from "./transition-booking";

export type ConfirmQuickBookingInput = { context: OperationContext; booking: BookingDto };

/**
 * Moves the booking to the default status of the `CONFIRMED` phase through the organization's own
 * transition and the fixed phase rules (a main assignee is required).
 */
export async function confirmQuickBooking({
  context,
  booking,
}: ConfirmQuickBookingInput): Promise<Result<BookingDto>> {
  const statusId = await firstStatusIdOfPhase({ context, phase: "CONFIRMED" });
  if (!statusId.ok) return statusId;
  const status = await context.db.bookingStatus.findFirstOrThrow({
    where: { id: statusId.value },
  });
  return transitionBooking({ context, before: booking, status, now: new Date() });
}
