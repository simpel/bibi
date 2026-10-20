import { restRoute } from "../../rest-route";

export const itemRoutes = [
  restRoute({ operation: "item.list", method: "GET", path: "/items" }),
  restRoute({
    operation: "item.list",
    method: "GET",
    path: "/venues/{venueId}/items",
    operationId: "itemListByVenue",
  }),
  restRoute({ operation: "item.get", method: "GET", path: "/items/{id}" }),
  restRoute({ operation: "item.resolve", method: "GET", path: "/items/{id}/resolved" }),
  restRoute({ operation: "item.create", method: "POST", path: "/items" }),
  restRoute({
    operation: "item.create",
    method: "POST",
    path: "/venues/{venueId}/items",
    operationId: "itemCreateInVenue",
  }),
  restRoute({ operation: "item.update", method: "PATCH", path: "/items/{id}" }),
  restRoute({ operation: "item.archive", method: "DELETE", path: "/items/{id}" }),
  restRoute({
    operation: "item.saveAsBundle",
    method: "POST",
    path: "/customers/{customerId}/bundles",
  }),
];
