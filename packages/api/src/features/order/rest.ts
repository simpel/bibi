import { restRoute } from "../../rest-route";

export const orderRoutes = [
  restRoute({ operation: "order.list", method: "GET", path: "/orders" }),
  restRoute({ operation: "order.get", method: "GET", path: "/orders/{id}" }),
  restRoute({ operation: "order.view", method: "GET", path: "/orders/{id}/view" }),
  restRoute({ operation: "order.create", method: "POST", path: "/orders" }),
  restRoute({
    operation: "order.createFromTemplate",
    method: "POST",
    path: "/orders/from-template",
  }),
  // A preview takes the packages or draft lines as its body and writes nothing (ADR 0081).
  restRoute({
    operation: "order.previewLines",
    method: "POST",
    path: "/orders/preview-lines",
    successStatus: 200,
  }),
  restRoute({ operation: "order.update", method: "PATCH", path: "/orders/{id}" }),
  restRoute({
    operation: "order.changeStatus",
    method: "POST",
    path: "/orders/{orderId}/status",
  }),
  restRoute({ operation: "order.export", method: "GET", path: "/orders/{id}/export" }),
  restRoute({
    operation: "order.statusHistory",
    method: "GET",
    path: "/orders/{orderId}/status-history",
  }),
  restRoute({
    operation: "order.estimateHistory",
    method: "GET",
    path: "/orders/{orderId}/estimate-history",
  }),
  restRoute({ operation: "order.expireHolds", method: "POST", path: "/orders/expire-holds" }),
];
