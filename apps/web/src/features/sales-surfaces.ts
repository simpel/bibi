import type { WebSurface } from "./web-surfaces";

/** The sales pipeline (ADR 0022): inquiries, options and bookings, part of `WEB_SURFACES`. */
export const SALES_SURFACES: readonly WebSurface[] = [
  { operation: "booking.list", route: "/bookings" },
  { operation: "booking.create", route: "/bookings" },
  { operation: "booking.get", route: "/bookings/[id]" },
  { operation: "booking.update", route: "/bookings/[id]" },
  { operation: "booking.assign", route: "/bookings/[id]" },
  { operation: "inboundEmail.list", route: "/bookings/[id]" },
  { operation: "inquiry.list", route: "/inquiries" },
  { operation: "inquiry.create", route: "/inquiries" },
  { operation: "inquiry.get", route: "/inquiries/[id]" },
  { operation: "inquiry.update", route: "/inquiries/[id]" },
  { operation: "inquiry.qualify", route: "/inquiries/[id]" },
  { operation: "inquiry.markLost", route: "/inquiries/[id]" },
  { operation: "inquiry.assign", route: "/inquiries/[id]" },
  // A bookable item's option queue is listed, placed, released and expired on the item page.
  { operation: "option.list", route: "/items/[id]" },
  { operation: "option.create", route: "/items/[id]" },
  { operation: "option.release", route: "/items/[id]" },
  { operation: "option.expireDue", route: "/items/[id]" },
];
