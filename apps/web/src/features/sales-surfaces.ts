import type { WebSurface } from "./web-surfaces";

/** The sales pipeline (ADR 0022, 0043): tickets, options and quotes, part of `WEB_SURFACES`. */
export const SALES_SURFACES: readonly WebSurface[] = [
  { operation: "ticket.list", route: "/tickets" },
  { operation: "ticket.create", route: "/tickets" },
  { operation: "ticket.get", route: "/tickets/[id]" },
  { operation: "ticket.update", route: "/tickets/[id]" },
  { operation: "inboundEmail.list", route: "/tickets/[id]" },
  // A bookable item's option queue is listed, placed, released and expired on the item page.
  { operation: "option.list", route: "/items/[id]" },
  { operation: "option.create", route: "/items/[id]" },
  { operation: "option.release", route: "/items/[id]" },
  { operation: "option.expireDue", route: "/items/[id]" },
  { operation: "quote.list", route: "/tickets/[id]" },
  { operation: "quote.create", route: "/tickets/[id]" },
  { operation: "quote.get", route: "/quotes/[id]" },
  { operation: "quote.update", route: "/quotes/[id]" },
  { operation: "quote.revise", route: "/quotes/[id]" },
  { operation: "quote.send", route: "/quotes/[id]" },
  { operation: "quote.decline", route: "/quotes/[id]" },
  { operation: "quote.expire", route: "/quotes/[id]" },
  // Assignments (ADR 0034): shown and changed on the ticket page; the list filters
  // by "Assigned to me" and "Following".
  { operation: "assignment.list", route: "/tickets/[id]" },
  { operation: "assignment.assign", route: "/tickets/[id]" },
  { operation: "assignment.follow", route: "/tickets/[id]" },
  { operation: "assignment.unfollow", route: "/tickets/[id]" },
];
