import { restRoute } from "../../rest-route";

export const paymentRoutes = [
  restRoute({ operation: "payment.list", method: "GET", path: "/tickets/{ticketId}/payments" }),
  restRoute({ operation: "payment.create", method: "POST", path: "/payments" }),
  restRoute({ operation: "payment.get", method: "GET", path: "/payments/{id}" }),
];
