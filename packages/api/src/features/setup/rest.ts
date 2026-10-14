import { restRoute } from "../../rest-route";

export const setupRoutes = [
  restRoute({ operation: "setup.list", method: "GET", path: "/setups" }),
  restRoute({ operation: "setup.get", method: "GET", path: "/setups/{id}" }),
  restRoute({ operation: "setup.create", method: "POST", path: "/setups" }),
  restRoute({ operation: "setup.update", method: "PATCH", path: "/setups/{id}" }),
  restRoute({ operation: "setup.archive", method: "DELETE", path: "/setups/{id}" }),
];
