import { restRoute } from "../../rest-route";

export const paymentRoutes = [
  restRoute({ operation: "payment.list", method: "GET", path: "/orders/{orderId}/payments" }),
  restRoute({ operation: "payment.create", method: "POST", path: "/payments" }),
  restRoute({ operation: "payment.get", method: "GET", path: "/payments/{id}" }),
  restRoute({ operation: "payment.balance", method: "GET", path: "/orders/{orderId}/balance" }),
];
