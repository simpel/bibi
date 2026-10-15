import { BookingSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a booking as tool results carry it (dates = ISO strings). */
export const BookingWireSchema = BookingSchema.extend({
  startsAt: z.string(),
  endsAt: z.string(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const BookingListWireSchema = z.object({
  items: z.array(BookingWireSchema),
  nextCursor: z.string().nullable(),
});

export type BookingWire = z.infer<typeof BookingWireSchema>;

const bookingTable = uiEntry({
  component: "booking-table",
  schema: BookingListWireSchema,
  toProps: ({ value }) => value,
});
const bookingCard = uiEntry({
  component: "booking-card",
  schema: BookingWireSchema,
  toProps: ({ value }) => ({ booking: value }),
});

/** Tool → component for bookings and their owners (ADR 0022). */
export const BOOKING_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  booking_list: bookingTable,
  booking_get: bookingCard,
  booking_create: bookingCard,
  booking_update: bookingCard,
  booking_assign: bookingCard,
  booking_changeStatus: bookingCard,
};
