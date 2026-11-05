import { restRoute } from "../../rest-route";

export const inboundEmailRoutes = [
  restRoute({
    operation: "inboundEmail.list",
    method: "GET",
    path: "/orders/{orderId}/inbound-emails",
  }),
  restRoute({ operation: "inboundEmail.get", method: "GET", path: "/inbound-emails/{id}" }),
];
