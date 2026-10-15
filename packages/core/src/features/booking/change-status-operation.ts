import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { BookingChangeStatusInputSchema, BookingSchema } from "./schema";
import { loadBooking } from "./to-booking-dto";
import { transitionBooking } from "./transition-booking";

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
    return transitionBooking({ context, before, status, reason, now: new Date() });
  },
});
