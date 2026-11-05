import { restRoute } from "../../rest-route";

const BASE = "/order-templates";

export const orderTemplateRoutes = [
  restRoute({ operation: "orderTemplate.list", method: "GET", path: BASE }),
  restRoute({ operation: "orderTemplate.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "orderTemplate.create", method: "POST", path: BASE }),
  restRoute({ operation: "orderTemplate.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "orderTemplate.archive", method: "DELETE", path: `${BASE}/{id}` }),
];
