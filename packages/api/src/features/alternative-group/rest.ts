import { restRoute } from "../../rest-route";

export const alternativeGroupRoutes = [
  restRoute({ operation: "alternativeGroup.list", method: "GET", path: "/alternative-groups" }),
  restRoute({
    operation: "alternativeGroup.list",
    method: "GET",
    path: "/tickets/{ticketId}/alternative-groups",
    operationId: "alternativeGroupListByTicket",
  }),
  restRoute({ operation: "alternativeGroup.get", method: "GET", path: "/alternative-groups/{id}" }),
  restRoute({ operation: "alternativeGroup.create", method: "POST", path: "/alternative-groups" }),
  restRoute({
    operation: "alternativeGroup.update",
    method: "PATCH",
    path: "/alternative-groups/{id}",
  }),
  restRoute({
    operation: "alternativeGroup.archive",
    method: "DELETE",
    path: "/alternative-groups/{id}",
  }),
  restRoute({
    operation: "alternativeGroup.choose",
    method: "PUT",
    path: "/alternative-groups/{id}/choice",
  }),
];
