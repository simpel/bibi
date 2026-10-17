import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { archiveProgramItemsOfBooking } from "../program-item/release-for-booking";
import { releaseBookingOccupancy } from "./cancellation";
import type { BookingDto } from "./schema";
import { toBookingDto } from "./to-booking-dto";

export type ArchiveBookingInput = { context: OperationContext; booking: BookingDto };

/**
 * The single place that archives a booking (#145, #166): its program items are archived and
 * every occupancy the booking or its program items hold is released, so no room stays blocked
 * for a booking that is gone. Audited per row. A booking archive operation and the customer
 * cascade (`customer.archive`) both go through here.
 */
export async function archiveBooking({
  context,
  booking,
}: ArchiveBookingInput): Promise<Result<BookingDto>> {
  const program = await archiveProgramItemsOfBooking({ context, bookingId: booking.id });
  if (!program.ok) return program;
  const released = await releaseBookingOccupancy({ context, bookingId: booking.id });
  if (!released.ok) return released;
  const row = await context.db.booking.update({
    where: { id: booking.id },
    data: { status: "ARCHIVED" },
  });
  const after = toBookingDto({ row });
  context.recordChange({ entityType: "booking", entityId: booking.id, before: booking, after });
  return ok({ value: after });
}
