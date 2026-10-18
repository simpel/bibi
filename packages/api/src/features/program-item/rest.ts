import { restRoute } from "../../rest-route";

export const programItemRoutes = [
  restRoute({ operation: "programItem.list", method: "GET", path: "/program-items" }),
  restRoute({
    operation: "programItem.list",
    method: "GET",
    path: "/tickets/{ticketId}/program-items",
    operationId: "programItemListByTicket",
  }),
  restRoute({ operation: "programItem.get", method: "GET", path: "/program-items/{id}" }),
  restRoute({ operation: "programItem.create", method: "POST", path: "/program-items" }),
  restRoute({ operation: "programItem.update", method: "PATCH", path: "/program-items/{id}" }),
  restRoute({ operation: "programItem.archive", method: "DELETE", path: "/program-items/{id}" }),
];
