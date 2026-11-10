import { restRoute } from "../../rest-route";

const BASE = "/item-type-groups";

export const itemTypeGroupRoutes = [
  restRoute({ operation: "itemTypeGroup.list", method: "GET", path: BASE }),
  restRoute({ operation: "itemTypeGroup.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "itemTypeGroup.create", method: "POST", path: BASE }),
  restRoute({ operation: "itemTypeGroup.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "itemTypeGroup.archive", method: "DELETE", path: `${BASE}/{id}` }),
  restRoute({ operation: "itemTypeGroup.reorder", method: "PUT", path: `${BASE}/order` }),
];
