import { restRoute } from "../../rest-route";

export const ticketRoutes = [
  restRoute({ operation: "ticket.list", method: "GET", path: "/tickets" }),
  restRoute({ operation: "ticket.get", method: "GET", path: "/tickets/{id}" }),
  restRoute({ operation: "ticket.create", method: "POST", path: "/tickets" }),
  restRoute({ operation: "ticket.update", method: "PATCH", path: "/tickets/{id}" }),
  restRoute({
    operation: "ticket.changePhase",
    method: "POST",
    path: "/tickets/{ticketId}/phase",
  }),
  restRoute({ operation: "ticket.export", method: "GET", path: "/tickets/{id}/export" }),
];
