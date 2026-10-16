import { defineOperation } from "../../operations/define-operation";
import { createQuickBooking } from "./create-quick-booking";
import { QuickBookingInputSchema } from "./quick-schema";
import { BookingSchema } from "./schema";

export const createQuickBookingOperation = defineOperation({
  name: "booking.createQuick",
  kind: "command",
  description:
    "Quick booking of a small meeting without inquiry and quote (ADR 0022): creates the " +
    "booking (default TENTATIVE status) and one program item that occupies the bookable item, " +
    "in one step. With paymentMethod INVOICE the booking is confirmed at once (default " +
    "CONFIRMED status, through the organization's own transition and the phase rules); with " +
    "PAYMENT_LINK it stays TENTATIVE until the payment is done. Needs booking:write and " +
    "programItem:write. An occupied item gives CONFLICT and nothing is created.",
  input: QuickBookingInputSchema,
  output: BookingSchema,
  permission: "booking:write",
  handler: ({ input, context }) => createQuickBooking({ context, input }),
});
