import type {
  AssetBooking,
  CalendarAsset,
  CalendarOrder,
} from "../../components/availability-calendar/calendar-types";
import { orderOfBooking } from "../../components/availability-calendar/order-of-booking";
import { ORDER_18 } from "./calendar-data";

/**
 * The order behind a booking, for the story's "click to open". Order 18 is the full demo
 * order; any other is put together from its bookings, each placed on its asset.
 */
export function orderOf({
  booking,
  bookings,
  assets,
}: {
  booking: AssetBooking;
  bookings: readonly AssetBooking[];
  assets: readonly CalendarAsset[];
}): CalendarOrder | null {
  if (!booking.order) return null;
  if (booking.order === ORDER_18.reference) return ORDER_18;
  return orderOfBooking({ booking, bookings, assets });
}
