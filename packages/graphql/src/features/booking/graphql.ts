import {
  assignBooking,
  type BookingDto,
  BookingSchema,
  changeBookingStatus,
  createBooking,
  createQuickBookingOperation,
  getBooking,
  listBookings,
  updateBooking,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { BookingStatusRef } from "../booking-status/graphql";
import { CustomerRef } from "../customer/graphql";
import { EntityTypeRef } from "../entity-type/graphql";

export const BookingRef = objectFromSchema<BookingDto>({
  name: "Booking",
  schema: BookingSchema,
  omit: ["organizationId"],
  description:
    "Booking – the conference or event as a whole: type and fields, customer, time, headcount, " +
    "the organization's own status and the owners (salesperson and coordinator).",
});
const BookingPageRef = pageType({ name: "BookingPage", item: BookingRef });

fieldFromOperation({ operation: listBookings, type: BookingPageRef, name: "bookings" });
fieldFromOperation({ operation: getBooking, type: BookingRef, name: "booking" });
mutationFromOperation({ operation: createBooking, type: BookingRef });
mutationFromOperation({ operation: createQuickBookingOperation, type: BookingRef });
mutationFromOperation({ operation: updateBooking, type: BookingRef });
mutationFromOperation({ operation: assignBooking, type: BookingRef });
mutationFromOperation({ operation: changeBookingStatus, type: BookingRef });

builder.objectField(BookingRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The booking type, with its fields.",
    resolve: (booking, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: booking.entityTypeId }) as never;
    },
  }),
);

builder.objectField(BookingRef, "customer", (t) =>
  t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer who orders (null if archived).",
    resolve: (booking, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:read" });
      return ctx.loaders.customer.load({ id: booking.customerId });
    },
  }),
);

builder.objectField(BookingRef, "bookingStatus", (t) =>
  t.field({
    type: BookingStatusRef,
    description: "The booking's status, with its phase (archived statuses included).",
    resolve: (booking, _args, ctx) => {
      requirePermission({ ctx, permission: "bookingStatus:read" });
      return ctx.loaders.bookingStatus.load({ id: booking.bookingStatusId }) as never;
    },
  }),
);

builder.objectField(CustomerRef, "bookings", (t) =>
  t.field({
    type: [BookingRef],
    description: "The customer's bookings in start order.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (customer, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listBookings,
        input: { customerId: customer.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: BookingDto[] };
      return page.items;
    },
  }),
);
