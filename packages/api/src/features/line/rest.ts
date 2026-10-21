import { restRoute } from "../../rest-route";

export const lineRoutes = [
  restRoute({ operation: "line.list", method: "GET", path: "/lines" }),
  restRoute({
    operation: "line.list",
    method: "GET",
    path: "/tickets/{ticketId}/lines",
    operationId: "lineListByTicket",
  }),
  restRoute({ operation: "line.get", method: "GET", path: "/lines/{id}" }),
  restRoute({ operation: "line.create", method: "POST", path: "/lines" }),
  restRoute({ operation: "line.expandBundle", method: "POST", path: "/lines/expand-bundle" }),
  restRoute({ operation: "line.update", method: "PATCH", path: "/lines/{id}" }),
  restRoute({ operation: "line.archive", method: "DELETE", path: "/lines/{id}" }),
  restRoute({
    operation: "line.changeState",
    method: "PUT",
    path: "/lines/{lineId}/state",
  }),
  restRoute({
    operation: "line.followPhase",
    method: "POST",
    path: "/lines/{lineId}/follow-phase",
  }),
];
