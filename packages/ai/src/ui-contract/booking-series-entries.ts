import { BookingSeriesSchema, SeriesOccurrenceSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a series occurrence as tool results carry it (dates = ISO strings). */
const SeriesOccurrenceWireSchema = SeriesOccurrenceSchema.extend({
  startsAt: z.string(),
  endsAt: z.string(),
});

/** JSON form of a booking series (ADR 0023) as tool results carry it. */
export const BookingSeriesWireSchema = BookingSeriesSchema.extend({
  startsAt: z.string(),
  cancelledAt: z.string().nullable(),
  occurrences: z.array(SeriesOccurrenceWireSchema),
  clashes: z.array(SeriesOccurrenceWireSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const BookingSeriesListWireSchema = z.object({
  items: z.array(BookingSeriesWireSchema),
  nextCursor: z.string().nullable(),
});

export type BookingSeriesWire = z.infer<typeof BookingSeriesWireSchema>;

const seriesCard = uiEntry({
  component: "booking-series-card",
  schema: BookingSeriesWireSchema,
  toProps: ({ value }) => ({ series: value }),
});

/** Tool → component for recurring bookings (ADR 0023). */
export const BOOKING_SERIES_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  bookingSeries_list: uiEntry({
    component: "booking-series-table",
    schema: BookingSeriesListWireSchema,
    toProps: ({ value }) => value,
  }),
  bookingSeries_get: seriesCard,
  bookingSeries_create: seriesCard,
  bookingSeries_updateOccurrences: seriesCard,
  bookingSeries_cancel: seriesCard,
};
