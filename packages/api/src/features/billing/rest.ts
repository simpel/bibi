import { restRoute } from "../../rest-route";

/** Bibi's own subscription (ADR 0095): one per organization, so no id in the path. */
export const billingRoutes = [
  restRoute({ operation: "billing.get", method: "GET", path: "/billing" }),
  restRoute({ operation: "billing.update", method: "PATCH", path: "/billing" }),
  restRoute({ operation: "billing.access", method: "GET", path: "/billing/access" }),
  restRoute({
    operation: "billing.startCheckout",
    method: "POST",
    path: "/billing/checkout",
    successStatus: 200,
  }),
  restRoute({
    operation: "billing.openPortal",
    method: "POST",
    path: "/billing/portal",
    successStatus: 200,
  }),
  restRoute({
    operation: "billing.sync",
    method: "POST",
    path: "/billing/sync",
    successStatus: 200,
  }),
  restRoute({
    operation: "billing.remindAdmins",
    method: "POST",
    path: "/billing/remind-admins",
    successStatus: 200,
  }),
  restRoute({
    operation: "billing.listSeatRequests",
    method: "GET",
    path: "/billing/seat-requests",
  }),
  restRoute({
    operation: "billing.approveSeat",
    method: "POST",
    path: "/billing/seat-requests/{id}/approve",
    successStatus: 200,
  }),
  restRoute({
    operation: "billing.rejectSeat",
    method: "POST",
    path: "/billing/seat-requests/{id}/reject",
    successStatus: 200,
  }),
];
