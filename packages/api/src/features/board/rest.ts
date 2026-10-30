import { restRoute } from "../../rest-route";

const PHASES = "/board-phases";

export const boardPhaseRoutes = [
  restRoute({ operation: "boardPhase.create", method: "POST", path: PHASES }),
  restRoute({ operation: "boardPhase.update", method: "PATCH", path: `${PHASES}/{id}` }),
  restRoute({ operation: "boardPhase.archive", method: "DELETE", path: `${PHASES}/{id}` }),
  restRoute({ operation: "boardPhase.reorder", method: "PUT", path: `${PHASES}/order` }),
  restRoute({
    operation: "boardPhase.moveStatus",
    method: "PUT",
    path: `${PHASES}/status`,
  }),
];

const BASE = "/boards";

export const boardRoutes = [
  restRoute({ operation: "board.list", method: "GET", path: BASE }),
  restRoute({ operation: "board.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "board.create", method: "POST", path: BASE }),
  restRoute({ operation: "board.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "board.archive", method: "DELETE", path: `${BASE}/{id}` }),
  restRoute({ operation: "board.reorder", method: "PUT", path: `${BASE}/order` }),
];
