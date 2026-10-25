import { TICKET_18 } from "./calendar-data";
import type { AssetBooking, CalendarAsset, CalendarTicket } from "./calendar-types";
import { PEOPLE } from "./people-data";

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
  const lines = bookings
    .filter((other) => other.ticket === booking.ticket)
    .map((line) => ({
      ...line,
      type: assets.find((asset) => asset.id === line.assetId)?.group ?? line.type,
      place: assets.find((asset) => asset.id === line.assetId)?.name ?? null,
    }));
  return {
    reference: booking.ticket,
    customer: booking.customer ?? "",
    purpose: booking.customer ?? booking.ticket,
    date: booking.date,
    headcount: booking.headcount ?? 0,
    contact: { person: PEOPLE.erik, via: "Ticket assignee" },
    lines,
  };
}
