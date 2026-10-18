import { restRoute } from "../../rest-route";

const BASE = "/ticket-templates";

export const ticketTemplateRoutes = [
  restRoute({ operation: "ticketTemplate.list", method: "GET", path: BASE }),
  restRoute({ operation: "ticketTemplate.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "ticketTemplate.create", method: "POST", path: BASE }),
  restRoute({ operation: "ticketTemplate.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "ticketTemplate.archive", method: "DELETE", path: `${BASE}/{id}` }),
];
