import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { assignBooking } from "./assign-operation";
import { bookingListWhere } from "./list-where";
import {
  BookingIdInputSchema,
  BookingListInputSchema,
  BookingListOutputSchema,
  BookingSchema,
} from "./schema";
import { loadBooking, toBookingDto } from "./to-booking-dto";
import { createBooking, updateBooking } from "./write-operations";

export const listBookings = defineOperation({
  name: "booking.list",
  kind: "query",
  description:
    "List the organization's bookings in start order. Filter by customer, type, status, " +
    "salesperson, coordinator or a time window (`from`/`to`).",
  input: BookingListInputSchema,
  output: BookingListOutputSchema,
  permission: "booking:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.booking.findMany({
      where: bookingListWhere({ input }),
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toBookingDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getBooking = defineOperation({
  name: "booking.get",
  kind: "query",
  description:
    "Get one booking by id: reference number, type and its field values, customer, time, " +
    "headcount, status and owners.",
  input: BookingIdInputSchema,
  output: BookingSchema,
  permission: "booking:read",
  handler: async ({ input, context }) => {
    const booking = await loadBooking({ context, id: input.id });
    return booking ? ok({ value: booking }) : notFound({ entity: "Booking" });
  },
});

export const bookingOperations = [
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  assignBooking,
];
