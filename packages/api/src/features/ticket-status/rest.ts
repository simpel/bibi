import { restRoute } from "../../rest-route";

const BASE = "/ticket-statuses";

export const ticketStatusRoutes = [
  restRoute({ operation: "ticketStatus.list", method: "GET", path: BASE }),
  restRoute({ operation: "ticketStatus.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "ticketStatus.create", method: "POST", path: BASE }),
  restRoute({ operation: "ticketStatus.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "ticketStatus.archive", method: "DELETE", path: `${BASE}/{id}` }),
  restRoute({
    operation: "ticketStatus.archivePreview",
    method: "GET",
    path: `${BASE}/{id}/archive-preview`,
  }),
  restRoute({ operation: "ticketStatus.reorder", method: "PUT", path: `${BASE}/order` }),
  restRoute({
    operation: "ticketStatus.setTransitions",
    method: "PUT",
    path: `${BASE}/{id}/transitions`,
  }),
  restRoute({
    operation: "ticketStatus.importTemplate",
    method: "POST",
    path: `${BASE}/import-template`,
  }),
];
