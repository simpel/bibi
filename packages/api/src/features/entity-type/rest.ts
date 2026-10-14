import { restRoute } from "../../rest-route";

export const entityTypeRoutes = [
  restRoute({ operation: "entityType.list", method: "GET", path: "/entity-types" }),
  restRoute({ operation: "entityType.get", method: "GET", path: "/entity-types/{id}" }),
  restRoute({ operation: "entityType.create", method: "POST", path: "/entity-types" }),
  restRoute({ operation: "entityType.update", method: "PATCH", path: "/entity-types/{id}" }),
  restRoute({ operation: "entityType.archive", method: "DELETE", path: "/entity-types/{id}" }),
];
