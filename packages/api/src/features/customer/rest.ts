import { restRoute } from "../../rest-route";

export const customerRoutes = [
  restRoute({ operation: "customer.list", method: "GET", path: "/customers" }),
  restRoute({ operation: "customer.get", method: "GET", path: "/customers/{id}" }),
  restRoute({ operation: "customer.create", method: "POST", path: "/customers" }),
  restRoute({ operation: "customer.update", method: "PATCH", path: "/customers/{id}" }),
  restRoute({ operation: "customer.archive", method: "DELETE", path: "/customers/{id}" }),
];
