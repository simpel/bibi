import { restRoute } from "../../rest-route";

export const orderVersionRoutes = [
  restRoute({ operation: "orderVersion.list", method: "GET", path: "/orders/{orderId}/versions" }),
  restRoute({ operation: "orderVersion.get", method: "GET", path: "/order-versions/{id}" }),
  restRoute({ operation: "orderVersion.name", method: "PUT", path: "/order-versions/{id}/name" }),
  restRoute({
    operation: "orderVersion.restore",
    method: "POST",
    path: "/order-versions/{id}/restore",
  }),
];
