import { restRoute } from "../../rest-route";

const BASE = "/status-grid";

export const statusGridRoutes = [
  restRoute({ operation: "statusGrid.get", method: "GET", path: BASE }),
  restRoute({ operation: "statusGrid.setCell", method: "PUT", path: `${BASE}/cells` }),
  restRoute({
    operation: "statusGrid.importTemplate",
    method: "POST",
    path: `${BASE}/import-template`,
  }),
];
