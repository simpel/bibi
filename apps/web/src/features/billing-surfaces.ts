import type { WebSurface } from "./web-surfaces";

/** Bibi's own subscription (ADR 0095), part of `WEB_SURFACES`. */
export const BILLING_SURFACES: readonly WebSurface[] = [
  { operation: "billing.get", route: "/settings/billing" },
  { operation: "billing.listSeatRequests", route: "/settings/billing" },
  { operation: "billing.update", route: "/settings/billing" },
  { operation: "billing.approveSeat", route: "/settings/billing" },
  { operation: "billing.rejectSeat", route: "/settings/billing" },
  { operation: "billing.openPortal", route: "/settings/billing" },
  { operation: "billing.startCheckout", route: "/billing/pay" },
  // The app layout also runs it on every page to close an unpaid organization (§5).
  { operation: "billing.access", route: "/billing/pay" },
  { operation: "billing.remindAdmins", route: "/billing/pay" },
  // Checkout's success page reads the subscription back before opening `returnTo`.
  { operation: "billing.sync", route: "/billing/pay/done" },
];
