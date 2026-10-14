import { restRoute } from "../../rest-route";

export const apiKeyRoutes = [
  restRoute({ operation: "apiKey.list", method: "GET", path: "/api-keys" }),
  restRoute({ operation: "apiKey.create", method: "POST", path: "/api-keys" }),
  restRoute({ operation: "apiKey.revoke", method: "DELETE", path: "/api-keys/{id}" }),
];
