import { restRoute } from "../../rest-route";

const BASE = "/order-statuses";

export const orderStatusRoutes = [
  restRoute({ operation: "orderStatus.list", method: "GET", path: BASE }),
  restRoute({ operation: "orderStatus.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "orderStatus.create", method: "POST", path: BASE }),
  restRoute({ operation: "orderStatus.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "orderStatus.archive", method: "DELETE", path: `${BASE}/{id}` }),
  restRoute({
    operation: "orderStatus.archivePreview",
    method: "GET",
    path: `${BASE}/{id}/archive-preview`,
  }),
  restRoute({ operation: "orderStatus.reorder", method: "PUT", path: `${BASE}/order` }),
  restRoute({
    operation: "orderStatus.setTransitions",
    method: "PUT",
    path: `${BASE}/{id}/transitions`,
  }),
  restRoute({
    operation: "orderStatus.setGates",
    method: "PUT",
    path: `${BASE}/{id}/gates`,
  }),
  restRoute({
    operation: "orderStatus.importTemplate",
    method: "POST",
    path: `${BASE}/import-template`,
  }),
];
