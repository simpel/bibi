import {
  type BookingDto,
  type BookingSeriesDto,
  BookingSeriesSchema,
  cancelBookingSeries,
  createBookingSeries,
  getBooking,
  getBookingSeries,
  listBookingSeries,
  type SeriesOccurrenceDto,
  SeriesOccurrenceSchema,
  updateBookingSeriesOccurrences,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { BookingRef } from "../booking/graphql";
import { CustomerRef } from "../customer/graphql";

export const SeriesOccurrenceRef = objectFromSchema<SeriesOccurrenceDto>({
  name: "SeriesOccurrence",
  schema: SeriesOccurrenceSchema,
  description: "One generated booking of a series; `clash` = its items could not be occupied.",
});

export const BookingSeriesRef = objectFromSchema<BookingSeriesDto>({
  name: "BookingSeries",
  schema: BookingSeriesSchema,
  omit: ["organizationId", "occurrences", "clashes"],
  description:
    "BookingSeries – a recurring booking (ADR 0023): customer, rule, template and the " +
    "occurrences it generated, each an ordinary booking.",
});
const BookingSeriesPageRef = pageType({ name: "BookingSeriesPage", item: BookingSeriesRef });

fieldFromOperation({
  operation: listBookingSeries,
  type: BookingSeriesPageRef,
  name: "bookingSeriesList",
});
fieldFromOperation({ operation: getBookingSeries, type: BookingSeriesRef, name: "bookingSeries" });
mutationFromOperation({ operation: createBookingSeries, type: BookingSeriesRef });
mutationFromOperation({ operation: updateBookingSeriesOccurrences, type: BookingSeriesRef });
mutationFromOperation({ operation: cancelBookingSeries, type: BookingSeriesRef });

builder.objectFields(BookingSeriesRef, (t) => ({
  occurrences: t.field({
    type: [SeriesOccurrenceRef],
    description: "Every occurrence in order.",
    resolve: (series) => series.occurrences,
  }),
  clashes: t.field({
    type: [SeriesOccurrenceRef],
    description: "The occurrences whose items could not be occupied.",
    resolve: (series) => series.clashes,
  }),
  customer: t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer who orders (null if archived).",
    resolve: (series, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:read" });
      return ctx.loaders.customer.load({ id: series.customerId });
    },
  }),
}));

builder.objectField(SeriesOccurrenceRef, "booking", (t) =>
  t.field({
    type: BookingRef,
    description: "The booking of this occurrence.",
    resolve: async (occurrence, _args, ctx) =>
      (await runOperation({
        operation: getBooking,
        input: { id: occurrence.bookingId },
        ctx,
      })) as BookingDto,
  }),
);

builder.objectField(BookingRef, "series", (t) =>
  t.field({
    type: BookingSeriesRef,
    nullable: true,
    description: "The series that generated the booking (null for a single booking).",
    resolve: async (booking, _args, ctx) => {
      if (!booking.seriesId) return null;
      return (await runOperation({
        operation: getBookingSeries,
        input: { id: booking.seriesId },
        ctx,
      })) as BookingSeriesDto;
    },
  }),
);
