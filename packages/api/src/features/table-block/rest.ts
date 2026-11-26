import { restRoute } from "../../rest-route";

export const tableBlockRoutes = [
  restRoute({ operation: "tableBlock.list", method: "GET", path: "/table-blocks" }),
  restRoute({ operation: "tableBlock.create", method: "POST", path: "/table-blocks" }),
  restRoute({ operation: "tableBlock.delete", method: "DELETE", path: "/table-blocks/{id}" }),
];
