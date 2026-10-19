import { restRoute } from "../../rest-route";

const BASE = "/ticket-phases";

export const ticketPhaseRoutes = [
  restRoute({ operation: "ticketPhase.list", method: "GET", path: BASE }),
  restRoute({ operation: "ticketPhase.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "ticketPhase.create", method: "POST", path: BASE }),
  restRoute({ operation: "ticketPhase.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "ticketPhase.archive", method: "DELETE", path: `${BASE}/{id}` }),
  restRoute({
    operation: "ticketPhase.archivePreview",
    method: "GET",
    path: `${BASE}/{id}/archive-preview`,
  }),
  restRoute({ operation: "ticketPhase.reorder", method: "PUT", path: `${BASE}/order` }),
  restRoute({
    operation: "ticketPhase.setTransitions",
    method: "PUT",
    path: `${BASE}/{id}/transitions`,
  }),
  restRoute({
    operation: "ticketPhase.importTemplate",
    method: "POST",
    path: `${BASE}/import-template`,
  }),
];
