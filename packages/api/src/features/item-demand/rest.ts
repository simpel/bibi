import { restRoute } from "../../rest-route";

export const itemDemandRoutes = [
  restRoute({ operation: "itemDemand.list", method: "GET", path: "/items/{itemId}/demands" }),
  restRoute({ operation: "itemDemand.get", method: "GET", path: "/item-demands/{id}" }),
  restRoute({ operation: "itemDemand.create", method: "POST", path: "/item-demands" }),
  restRoute({ operation: "itemDemand.update", method: "PATCH", path: "/item-demands/{id}" }),
  restRoute({ operation: "itemDemand.archive", method: "DELETE", path: "/item-demands/{id}" }),
];
