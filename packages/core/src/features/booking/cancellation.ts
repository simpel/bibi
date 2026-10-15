import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { toOccupancyDto } from "../occupancy/to-occupancy-dto";
import type { BookingDto } from "./schema";

/** `Occupancy.sourceType` of the rows a booking holds; `sourceId` is the booking id. */
export const BOOKING_OCCUPANCY_SOURCE = "booking";

export type CancellationInput = {
  context: OperationContext;
  /** The booking as it was before the cancellation. */
  booking: BookingDto;
  reason: string;
};

/**
 * Applies the organization's cancellation terms to a cancelled booking (ADR 0022). Cancellation
 * terms are not built yet (domain model: CancellationTerms); when they are, their hook goes in
 * `CANCELLATION_HOOKS` and runs inside the same transaction as the status change. An error rolls
 * the whole change back.
 */
export type CancellationHook = (input: CancellationInput) => Promise<Result<true>>;

export const CANCELLATION_HOOKS: CancellationHook[] = [];

export type ReleaseBookingOccupancyInput = { context: OperationContext; bookingId: string };

/** Releases every active occupancy the booking holds, so the items can be booked again. */
export async function releaseBookingOccupancy({
  context,
  bookingId,
}: ReleaseBookingOccupancyInput): Promise<Result<true>> {
  const rows = await context.db.occupancy.findMany({
    where: { sourceType: BOOKING_OCCUPANCY_SOURCE, sourceId: bookingId },
  });
  for (const row of rows) {
    const released = await context.db.occupancy.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({
      entityType: "occupancy",
      entityId: row.id,
      before: toOccupancyDto({ row }),
      after: toOccupancyDto({ row: released }),
    });
  }
  return ok({ value: true });
}

/** Everything the `CANCELLED` phase does beyond the status change itself. */
export async function applyCancellation({
  context,
  booking,
  reason,
}: CancellationInput): Promise<Result<true>> {
  const released = await releaseBookingOccupancy({ context, bookingId: booking.id });
  if (!released.ok) return released;
  for (const hook of CANCELLATION_HOOKS) {
    const result = await hook({ context, booking, reason });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
