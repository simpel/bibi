import { restRoute } from "../../rest-route";

export const apiKeyRoutes = [
  restRoute({ operation: "apiKey.list", method: "GET", path: "/api-keys" }),
  restRoute({ operation: "apiKey.get", method: "GET", path: "/api-keys/{id}" }),
  restRoute({ operation: "apiKey.create", method: "POST", path: "/api-keys" }),
  restRoute({ operation: "apiKey.update", method: "PATCH", path: "/api-keys/{id}" }),
  restRoute({ operation: "apiKey.revoke", method: "DELETE", path: "/api-keys/{id}" }),
];
