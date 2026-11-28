import {
  AvailabilitySlotSchema,
  ReservationSchema,
  ReservationTotalsSchema,
  ReservationWarningSchema,
  TableBlockSchema,
} from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a reservation as tool results carry it (dates = ISO strings). */
export const ReservationWireSchema = ReservationSchema.extend({
  startsAt: z.string(),
  endsAt: z.string(),
  seatedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  /** Only create and update return warnings. */
  warnings: z.array(ReservationWarningSchema).optional(),
});
export const ReservationListWireSchema = z.object({
  items: z.array(ReservationWireSchema),
  totals: ReservationTotalsSchema,
});
export const ReservationDayViewWireSchema = z.object({
  reservations: ReservationListWireSchema,
});
export const ReservationAvailabilityWireSchema = z.object({
  timeZone: z.string(),
  slots: z.array(AvailabilitySlotSchema.extend({ startsAt: z.string(), endsAt: z.string() })),
});
export const TableBlockWireSchema = TableBlockSchema.extend({
  startsAt: z.string(),
  endsAt: z.string(),
});
export const TableBlockListWireSchema = z.object({ items: z.array(TableBlockWireSchema) });

export type ReservationWire = z.infer<typeof ReservationWireSchema>;
export type ReservationTotalsWire = z.infer<typeof ReservationTotalsSchema>;
export type AvailabilitySlotWire = z.infer<
  typeof ReservationAvailabilityWireSchema
>["slots"][number];
export type TableBlockWire = z.infer<typeof TableBlockWireSchema>;

const reservationCard = uiEntry({
  component: "reservation-card",
  schema: ReservationWireSchema,
  toProps: ({ value }) => ({ reservation: value }),
});
const reservationDayList = uiEntry({
  component: "reservation-day-list",
  schema: ReservationListWireSchema,
  toProps: ({ value }) => value,
});
const availabilityGrid = uiEntry({
  component: "reservation-availability",
  schema: ReservationAvailabilityWireSchema,
  toProps: ({ value }) => value,
});
const tableBlockList = uiEntry({
  component: "table-block-list",
  schema: TableBlockListWireSchema,
  toProps: ({ value }) => value,
});
const tableBlockOne = uiEntry({
  component: "table-block-list",
  schema: TableBlockWireSchema,
  toProps: ({ value }) => ({ items: [value] }),
});

/** Tool → component for table reservations and table blocks (ADR 0119). */
export const RESERVATION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  reservation_list: reservationDayList,
  reservation_dayView: uiEntry({
    component: "reservation-day-list",
    schema: ReservationDayViewWireSchema,
    toProps: ({ value }) => value.reservations,
  }),
  reservation_get: reservationCard,
  reservation_availability: availabilityGrid,
  reservation_create: reservationCard,
  reservation_update: reservationCard,
  reservation_cancel: reservationCard,
  reservation_seat: reservationCard,
  reservation_unseat: reservationCard,
  reservation_complete: reservationCard,
  reservation_markNoShow: reservationCard,
  reservation_revertNoShow: reservationCard,
  tableBlock_list: tableBlockList,
  tableBlock_create: tableBlockList,
  tableBlock_delete: tableBlockOne,
};
