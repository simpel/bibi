import { restRoute } from "../../rest-route";

export const contactRoutes = [
  restRoute({ operation: "contact.list", method: "GET", path: "/contacts" }),
  restRoute({
    operation: "contact.list",
    method: "GET",
    path: "/customers/{customerId}/contacts",
    operationId: "contactListByCustomer",
  }),
  restRoute({ operation: "contact.get", method: "GET", path: "/contacts/{id}" }),
  restRoute({ operation: "contact.create", method: "POST", path: "/contacts" }),
  restRoute({
    operation: "contact.create",
    method: "POST",
    path: "/customers/{customerId}/contacts",
    operationId: "contactCreateAtCustomer",
  }),
  restRoute({ operation: "contact.update", method: "PATCH", path: "/contacts/{id}" }),
  restRoute({ operation: "contact.archive", method: "DELETE", path: "/contacts/{id}" }),
];
