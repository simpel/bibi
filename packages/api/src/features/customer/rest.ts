import { restRoute } from "../../rest-route";

export const customerRoutes = [
  restRoute({ operation: "customer.list", method: "GET", path: "/customers" }),
  restRoute({ operation: "customer.get", method: "GET", path: "/customers/{id}" }),
  // A query with a body: a contact's email stays out of the URL and the access logs (ADR 0081).
  restRoute({
    operation: "customer.findSimilar",
    method: "POST",
    path: "/customers/find-similar",
    successStatus: 200,
  }),
  restRoute({ operation: "customer.create", method: "POST", path: "/customers" }),
  restRoute({ operation: "customer.update", method: "PATCH", path: "/customers/{id}" }),
  restRoute({ operation: "customer.archive", method: "DELETE", path: "/customers/{id}" }),
];
