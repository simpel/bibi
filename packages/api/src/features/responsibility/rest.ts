import { restRoute } from "../../rest-route";

export const responsibilityRoutes = [
  restRoute({ operation: "responsibility.list", method: "GET", path: "/responsibilities" }),
  restRoute({ operation: "responsibility.get", method: "GET", path: "/responsibilities/{id}" }),
  restRoute({ operation: "responsibility.create", method: "POST", path: "/responsibilities" }),
  restRoute({
    operation: "responsibility.update",
    method: "PATCH",
    path: "/responsibilities/{id}",
  }),
  restRoute({
    operation: "responsibility.archive",
    method: "DELETE",
    path: "/responsibilities/{id}",
  }),
];
