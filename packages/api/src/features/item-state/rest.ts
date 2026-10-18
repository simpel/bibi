import { restRoute } from "../../rest-route";

const BASE = "/item-states";

export const itemStateRoutes = [
  restRoute({ operation: "itemState.list", method: "GET", path: BASE }),
  restRoute({ operation: "itemState.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "itemState.create", method: "POST", path: BASE }),
  restRoute({ operation: "itemState.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "itemState.archive", method: "DELETE", path: `${BASE}/{id}` }),
  restRoute({ operation: "itemState.reorder", method: "PUT", path: `${BASE}/order` }),
  restRoute({
    operation: "itemState.setTransitions",
    method: "PUT",
    path: `${BASE}/{id}/transitions`,
  }),
];
