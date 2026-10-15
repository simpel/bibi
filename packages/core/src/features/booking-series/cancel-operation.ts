import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { firstStatusIdOfPhase } from "../booking/booking-defaults";
import { toBookingDto } from "../booking/to-booking-dto";
import { transitionBooking } from "../booking/transition-booking";
import { BookingSeriesCancelInputSchema } from "./occurrence-schema";
import { openOccurrences } from "./open-occurrences";
import { BookingSeriesSchema } from "./schema";
import { loadBookingSeries } from "./to-booking-series-dto";

type CancelStatusInput = { context: OperationContext; statusId: string | undefined };

/** The given status, which must be in the `CANCELLED` phase, or the phase's first status. */
async function cancelStatus({ context, statusId }: CancelStatusInput) {
  let id = statusId;
  if (!id) {
    const first = await firstStatusIdOfPhase({ context, phase: "CANCELLED" });
    if (!first.ok) return first;
    id = first.value;
  }
  const status = await context.db.bookingStatus.findFirst({ where: { id, phase: "CANCELLED" } });
  if (status) return ok({ value: status });
  const message = "Not a status in the CANCELLED phase";
  return invalid({ message, issues: [{ path: "statusId", message }] });
}

export const cancelBookingSeries = defineOperation({
  name: "bookingSeries.cancel",
  kind: "command",
  description:
    "Cancel a recurring booking (ADR 0023): every upcoming occurrence (not yet started, not " +
    "cancelled or completed) moves to a status in the CANCELLED phase with the reason, which " +
    "releases its occupancy. Occurrences that have started or ended are not touched. The " +
    "organization must allow the transition from each occurrence's status, else CONFLICT.",
  input: BookingSeriesCancelInputSchema,
  output: BookingSeriesSchema,
  permission: "booking:write",
  handler: async ({ input: { id, reason, statusId }, context }) => {
    const before = await loadBookingSeries({ context, id });
    if (!before) return notFound({ entity: "BookingSeries" });
    if (before.cancelledAt) return conflict({ message: "The series is already cancelled" });
    const status = await cancelStatus({ context, statusId });
    if (!status.ok) return status;
    const now = new Date();
    const upcoming = await openOccurrences({
      context,
      seriesId: id,
      where: { startsAt: { gt: now } },
    });
    for (const row of upcoming) {
      const booking = toBookingDto({ row });
      const moved: Result<unknown> = await transitionBooking({
        ...{ context, before: booking, status: status.value, reason, now },
      });
      if (!moved.ok) return moved;
    }
    await context.db.bookingSeries.update({
      where: { id },
      data: { cancelledAt: now, cancellationReason: reason },
    });
    const after = await loadBookingSeries({ context, id });
    if (!after) return notFound({ entity: "BookingSeries" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
