import type {
  AssetBooking,
  CalendarAsset,
  CalendarTicket,
} from "../../components/availability-calendar/calendar-types";
import { ticketOfBooking } from "../../components/availability-calendar/ticket-of-booking";
import { TICKET_18 } from "./calendar-data";

/**
 * The ticket behind a booking, for the story's "click to open". Ticket 18 is the full demo
 * ticket; any other is put together from its bookings, each placed on its asset.
 */
export function ticketOf({
  booking,
  bookings,
  assets,
}: {
  booking: AssetBooking;
  bookings: readonly AssetBooking[];
  assets: readonly CalendarAsset[];
}): CalendarTicket | null {
  if (!booking.ticket) return null;
  if (booking.ticket === TICKET_18.reference) return TICKET_18;
  return ticketOfBooking({ booking, bookings, assets });
}
