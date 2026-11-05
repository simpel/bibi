import type { WebSurface } from "./web-surfaces";

/** The sales pipeline (ADR 0022, 0043): orders, holds and quotes, part of `WEB_SURFACES`. */
export const SALES_SURFACES: readonly WebSurface[] = [
  { operation: "order.list", route: "/orders" },
  { operation: "order.create", route: "/orders" },
  // The one-page intake (ADR 0081): package groups and the duplicate check before a new customer.
  { operation: "order.previewLines", route: "/new/order" },
  { operation: "customer.findSimilar", route: "/new/order" },
  { operation: "orderDraft.fromMessage", route: "/new/order" },
  { operation: "order.get", route: "/orders/[id]" },
  { operation: "order.update", route: "/orders/[id]" },
  // Inbound messages of every channel (ADR 0085): the inbox, one message, and an order's messages.
  { operation: "inboundMessage.list", route: "/inbox" },
  // The sidebar's inbox badge, on every page (ADR 0085, 0094).
  { operation: "inboundMessage.openCount", route: "/inbox" },
  { operation: "inboundMessage.get", route: "/inbox/[id]" },
  { operation: "inboundMessage.attachToOrder", route: "/inbox/[id]" },
  { operation: "inboundMessage.markRead", route: "/inbox" },
  { operation: "inboundMessage.markUnread", route: "/inbox" },
  { operation: "inboundMessage.delete", route: "/inbox" },
  { operation: "inboundEndpoint.list", route: "/inbox" },
  // The status history and the facts that contradict the status (ADR 0054).
  { operation: "order.statusHistory", route: "/orders/[id]" },
  { operation: "order.estimateHistory", route: "/orders/[id]" },
  // A bundle is added from the run schedule as a bundle line with its part lines (ADR 0059).
  { operation: "line.expandBundle", route: "/orders/[id]" },
  { operation: "line.chooseOptions", route: "/orders/[id]" },
  // The unit picker on a booking: its slots, the pool's free units with the prepick, the choice (ADR 0059).
  { operation: "lineAllocation.list", route: "/orders/[id]" },
  { operation: "lineAllocation.assign", route: "/orders/[id]" },
  { operation: "item.freeUnits", route: "/orders/[id]" },
  // The unit picker shows the member behind a staff item (ADR 0068).
  { operation: "memberProfile.list", route: "/orders/[id]" },
  // The Resources and Staffing lists on the needing item (ADR 0059).
  { operation: "itemDemand.list", route: "/items/[id]" },
  { operation: "itemDemand.create", route: "/items/[id]" },
  { operation: "itemDemand.update", route: "/items/[id]" },
  { operation: "itemDemand.archive", route: "/items/[id]" },
  // Alternatives (ADR 0052): grouped and chosen on the order page.
  { operation: "alternativeGroup.list", route: "/orders/[id]" },
  { operation: "alternativeGroup.create", route: "/orders/[id]" },
  { operation: "alternativeGroup.update", route: "/orders/[id]" },
  { operation: "alternativeGroup.archive", route: "/orders/[id]" },
  { operation: "alternativeGroup.choose", route: "/orders/[id]" },
  { operation: "quote.list", route: "/orders/[id]" },
  { operation: "quote.create", route: "/orders/[id]" },
  { operation: "quote.get", route: "/quotes/[id]" },
  { operation: "quote.update", route: "/quotes/[id]" },
  { operation: "quote.revise", route: "/quotes/[id]" },
  { operation: "quote.send", route: "/quotes/[id]" },
  { operation: "quote.accept", route: "/quotes/[id]" },
  { operation: "quote.decline", route: "/quotes/[id]" },
  { operation: "quote.expire", route: "/quotes/[id]" },
  // Assignments (ADR 0034): shown and changed on the order page; the list filters
  // by "Assigned to me" and "Following".
  { operation: "assignment.list", route: "/orders/[id]" },
  { operation: "assignment.assign", route: "/orders/[id]" },
  { operation: "assignment.follow", route: "/orders/[id]" },
  { operation: "assignment.unfollow", route: "/orders/[id]" },
];
