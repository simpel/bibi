import { restRoute } from "../../rest-route";

export const occupancyRoutes = [
  restRoute({ operation: "occupancy.list", method: "GET", path: "/occupancies" }),
  restRoute({
    operation: "occupancy.list",
    method: "GET",
    path: "/items/{itemId}/occupancies",
    operationId: "occupancyListByItem",
  }),
  restRoute({ operation: "occupancy.get", method: "GET", path: "/occupancies/{id}" }),
  restRoute({ operation: "occupancy.create", method: "POST", path: "/occupancies" }),
  restRoute({ operation: "occupancy.update", method: "PATCH", path: "/occupancies/{id}" }),
  restRoute({ operation: "occupancy.archive", method: "DELETE", path: "/occupancies/{id}" }),
];
