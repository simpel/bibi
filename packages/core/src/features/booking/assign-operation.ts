import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { checkCoordinatorKept, checkOwners } from "./booking-rules";
import { BookingAssignInputSchema, BookingSchema } from "./schema";
import { loadBooking, toBookingDto } from "./to-booking-dto";

export const assignBooking = defineOperation({
  name: "booking.assign",
  kind: "command",
  description:
    "Change a booking's salesperson and/or coordinator (ADR 0022). Both must be members of the " +
    "organization (member.list userId); null removes an owner, an omitted owner is unchanged. " +
    "The coordinator cannot be removed from the CONFIRMED phase on.",
  input: BookingAssignInputSchema,
  output: BookingSchema,
  permission: "booking:write",
  handler: async ({ input: { id, ...owners }, context }) => {
    if (owners.salesOwnerId === undefined && owners.coordinatorId === undefined) {
      return invalid({ message: "Give salesOwnerId, coordinatorId or both" });
    }
    const before = await loadBooking({ context, id });
    if (!before) return notFound({ entity: "Booking" });
    const members = await checkOwners({ context, ...owners });
    if (!members.ok) return members;
    if (owners.coordinatorId === null && before.coordinatorId !== null) {
      const kept = await checkCoordinatorKept({ context, bookingStatusId: before.bookingStatusId });
      if (!kept.ok) return kept;
    }
    const row = await context.db.booking.update({ where: { id }, data: owners });
    const booking = toBookingDto({ row });
    context.recordChange({ entityId: id, before, after: booking });
    return ok({ value: booking });
  },
});
