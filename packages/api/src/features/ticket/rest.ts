import { restRoute } from "../../rest-route";

export const ticketRoutes = [
  restRoute({ operation: "ticket.list", method: "GET", path: "/tickets" }),
  restRoute({ operation: "ticket.get", method: "GET", path: "/tickets/{id}" }),
  restRoute({ operation: "ticket.create", method: "POST", path: "/tickets" }),
  restRoute({
    operation: "ticket.createFromTemplate",
    method: "POST",
    path: "/tickets/from-template",
  }),
  restRoute({ operation: "ticket.update", method: "PATCH", path: "/tickets/{id}" }),
  restRoute({
    operation: "ticket.changeStatus",
    method: "POST",
    path: "/tickets/{ticketId}/status",
  }),
  restRoute({ operation: "ticket.export", method: "GET", path: "/tickets/{id}/export" }),
  restRoute({
    operation: "ticket.statusHistory",
    method: "GET",
    path: "/tickets/{ticketId}/status-history",
  }),
  restRoute({ operation: "ticket.expireHolds", method: "POST", path: "/tickets/expire-holds" }),
];
