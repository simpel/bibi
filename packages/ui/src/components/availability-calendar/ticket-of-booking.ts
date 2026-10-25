import type {
  AssetBooking,
  CalendarAsset,
  CalendarContact,
  CalendarTicket,
} from "./calendar-types";

export type TicketOfBookingInput = {
  booking: AssetBooking;
  /** Every loaded booking: the ticket's others on the same day become its lanes. */
  bookings: readonly AssetBooking[];
  assets: readonly CalendarAsset[];
};

const NO_CONTACT: CalendarContact = { person: { id: "", name: "", role: "" }, via: "" };

/**
 * The ticket behind a booking as the calendar knows it: its bookings that day, each on its asset
 * (the group is the line's type, the asset its place). `null` for a manual block.
 */
export function ticketOfBooking({ booking, bookings, assets }: TicketOfBookingInput) {
  if (!booking.ticket) return null;
  const assetOf = new Map(assets.map((asset) => [asset.id, asset]));
  const lines = bookings
    .filter((other) => other.ticket === booking.ticket && other.date === booking.date)
    .map((line) => ({
      ...line,
      type: assetOf.get(line.assetId)?.group ?? line.type,
      place: assetOf.get(line.assetId)?.name ?? null,
    }));
  const ticket: CalendarTicket = {
    reference: booking.ticket,
    customer: booking.customer ?? "",
    purpose: booking.customer ?? booking.name,
    date: booking.date,
    headcount: booking.headcount ?? 0,
    contact: booking.contact ?? NO_CONTACT,
    lines,
  };
  return ticket;
}
