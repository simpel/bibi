import { restRoute } from "../../rest-route";

const BASE = "/phase-grid";

export const phaseGridRoutes = [
  restRoute({ operation: "phaseGrid.get", method: "GET", path: BASE }),
  restRoute({ operation: "phaseGrid.setCell", method: "PUT", path: `${BASE}/cells` }),
];
