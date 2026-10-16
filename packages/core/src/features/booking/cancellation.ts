import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { releaseOccupancyBySource } from "../occupancy/release-by-source";
import { releaseProgramItemsOfBooking } from "../program-item/release-for-booking";
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
export const releaseBookingOccupancy = ({
  context,
  bookingId,
}: ReleaseBookingOccupancyInput): Promise<Result<true>> =>
  releaseOccupancyBySource({ context, sourceType: BOOKING_OCCUPANCY_SOURCE, sourceId: bookingId });

/** Everything the `CANCELLED` phase does beyond the status change itself. */
export async function applyCancellation({
  context,
  booking,
  reason,
}: CancellationInput): Promise<Result<true>> {
  const released = await releaseBookingOccupancy({ context, bookingId: booking.id });
  if (!released.ok) return released;
  const program = await releaseProgramItemsOfBooking({ context, bookingId: booking.id });
  if (!program.ok) return program;
  for (const hook of CANCELLATION_HOOKS) {
    const result = await hook({ context, booking, reason });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
