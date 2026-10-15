import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { cancelBookingSeries } from "./cancel-operation";
import {
  BookingSeriesIdInputSchema,
  BookingSeriesListInputSchema,
  BookingSeriesListOutputSchema,
  BookingSeriesSchema,
} from "./schema";
import { loadBookingSeries, toBookingSeriesDto, WITH_OCCURRENCES } from "./to-booking-series-dto";
import { updateBookingSeriesOccurrences } from "./update-occurrences-operation";
import { createBookingSeries } from "./write-operations";

export const listBookingSeries = defineOperation({
  name: "bookingSeries.list",
  kind: "query",
  description:
    "List the organization's recurring bookings, newest first, each with its occurrences " +
    "(booking id, reference, time, status and `clash`). Filter by customer.",
  input: BookingSeriesListInputSchema,
  output: BookingSeriesListOutputSchema,
  permission: "booking:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.bookingSeries.findMany({
      where: input.customerId ? { customerId: input.customerId } : {},
      include: WITH_OCCURRENCES,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toBookingSeriesDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getBookingSeries = defineOperation({
  name: "bookingSeries.get",
  kind: "query",
  description:
    "Get one recurring booking by id: customer, rule, template (items, setup, owners), every " +
    "occurrence with its booking and the occurrences flagged as `clashes`.",
  input: BookingSeriesIdInputSchema,
  output: BookingSeriesSchema,
  permission: "booking:read",
  handler: async ({ input, context }) => {
    const series = await loadBookingSeries({ context, id: input.id });
    return series ? ok({ value: series }) : notFound({ entity: "BookingSeries" });
  },
});

export const bookingSeriesOperations = [
  listBookingSeries,
  getBookingSeries,
  createBookingSeries,
  updateBookingSeriesOccurrences,
  cancelBookingSeries,
];

export { cancelBookingSeries, updateBookingSeriesOccurrences };
