import { restRoute } from "../../rest-route";

export const workOrderRoutes = [
  restRoute({ operation: "workOrder.list", method: "GET", path: "/work-orders" }),
  restRoute({
    operation: "workOrder.list",
    method: "GET",
    path: "/tickets/{ticketId}/work-orders",
    operationId: "workOrderListByTicket",
  }),
  restRoute({ operation: "workOrder.get", method: "GET", path: "/work-orders/{id}" }),
  restRoute({ operation: "workOrder.generate", method: "POST", path: "/work-orders" }),
  restRoute({ operation: "workOrder.send", method: "POST", path: "/work-orders/{id}/send" }),
];
