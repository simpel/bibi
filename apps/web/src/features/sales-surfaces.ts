import type { WebSurface } from "./web-surfaces";

/** The sales pipeline (ADR 0022, 0043): tickets, holds and quotes, part of `WEB_SURFACES`. */
export const SALES_SURFACES: readonly WebSurface[] = [
  { operation: "ticket.list", route: "/tickets" },
  { operation: "ticket.create", route: "/tickets" },
  { operation: "ticket.get", route: "/tickets/[id]" },
  { operation: "ticket.update", route: "/tickets/[id]" },
  { operation: "inboundEmail.list", route: "/tickets/[id]" },
  // The phase history and the facts that contradict the phase (ADR 0054).
  { operation: "ticket.phaseHistory", route: "/tickets/[id]" },
  // Overdue soft holds (ADR 0044) are expired by hand from the ticket list.
  { operation: "ticket.expireHolds", route: "/tickets" },
  // Alternatives (ADR 0052): grouped and chosen on the ticket page.
  { operation: "alternativeGroup.list", route: "/tickets/[id]" },
  { operation: "alternativeGroup.create", route: "/tickets/[id]" },
  { operation: "alternativeGroup.update", route: "/tickets/[id]" },
  { operation: "alternativeGroup.archive", route: "/tickets/[id]" },
  { operation: "alternativeGroup.choose", route: "/tickets/[id]" },
  { operation: "quote.list", route: "/tickets/[id]" },
  { operation: "quote.create", route: "/tickets/[id]" },
  { operation: "quote.get", route: "/quotes/[id]" },
  { operation: "quote.update", route: "/quotes/[id]" },
  { operation: "quote.revise", route: "/quotes/[id]" },
  { operation: "quote.send", route: "/quotes/[id]" },
  { operation: "quote.accept", route: "/quotes/[id]" },
  { operation: "quote.decline", route: "/quotes/[id]" },
  { operation: "quote.expire", route: "/quotes/[id]" },
  // Assignments (ADR 0034): shown and changed on the ticket page; the list filters
  // by "Assigned to me" and "Following".
  { operation: "assignment.list", route: "/tickets/[id]" },
  { operation: "assignment.assign", route: "/tickets/[id]" },
  { operation: "assignment.follow", route: "/tickets/[id]" },
  { operation: "assignment.unfollow", route: "/tickets/[id]" },
];
