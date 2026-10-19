import { restRoute } from "../../rest-route";

export const requirementRoutes = [
  restRoute({ operation: "requirement.list", method: "GET", path: "/requirements" }),
  restRoute({
    operation: "requirement.list",
    method: "GET",
    path: "/tickets/{ticketId}/requirements",
    operationId: "requirementListByTicket",
  }),
  restRoute({
    operation: "requirement.list",
    method: "GET",
    path: "/lines/{lineId}/requirements",
    operationId: "requirementListByLine",
  }),
  restRoute({ operation: "requirement.get", method: "GET", path: "/requirements/{id}" }),
  restRoute({ operation: "requirement.create", method: "POST", path: "/requirements" }),
  restRoute({ operation: "requirement.update", method: "PATCH", path: "/requirements/{id}" }),
  restRoute({ operation: "requirement.archive", method: "DELETE", path: "/requirements/{id}" }),
];
