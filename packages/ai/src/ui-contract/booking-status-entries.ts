import { BookingStatusSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a booking status as tool results carry it (dates = ISO strings). */
export const BookingStatusWireSchema = BookingStatusSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const BookingStatusListWireSchema = z.object({
  items: z.array(BookingStatusWireSchema),
  nextCursor: z.string().nullable(),
});
/** `bookingStatus_importTemplate` output: the statuses it created. */
export const BookingStatusImportWireSchema = z.object({
  created: z.array(BookingStatusWireSchema),
  skipped: z.array(z.string()),
  transitionsAdded: z.number(),
});

export type BookingStatusWire = z.infer<typeof BookingStatusWireSchema>;

const statusTable = uiEntry({
  component: "booking-status-table",
  schema: BookingStatusListWireSchema,
  toProps: ({ value }) => value,
});
const statusCard = uiEntry({
  component: "booking-status-card",
  schema: BookingStatusWireSchema,
  toProps: ({ value }) => ({ status: value }),
});

/** Tool → component for the organization's booking statuses (ADR 0022). */
export const BOOKING_STATUS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  bookingStatus_list: statusTable,
  bookingStatus_get: statusCard,
  bookingStatus_create: statusCard,
  bookingStatus_update: statusCard,
  bookingStatus_archive: statusCard,
  bookingStatus_reorder: statusTable,
  bookingStatus_setTransitions: statusCard,
  bookingStatus_importTemplate: uiEntry({
    component: "booking-status-table",
    schema: BookingStatusImportWireSchema,
    toProps: ({ value }) => ({ items: value.created, nextCursor: null }),
  }),
};
