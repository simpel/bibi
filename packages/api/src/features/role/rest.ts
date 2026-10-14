import { restRoute } from "../../rest-route";

export const roleRoutes = [
  restRoute({ operation: "role.list", method: "GET", path: "/roles" }),
  restRoute({ operation: "role.get", method: "GET", path: "/roles/{id}" }),
  restRoute({ operation: "role.create", method: "POST", path: "/roles" }),
  restRoute({ operation: "role.update", method: "PATCH", path: "/roles/{id}" }),
  restRoute({ operation: "role.archive", method: "DELETE", path: "/roles/{id}" }),
  restRoute({ operation: "role.importTemplate", method: "POST", path: "/roles/import-template" }),
];
