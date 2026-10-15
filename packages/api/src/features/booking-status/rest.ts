import { restRoute } from "../../rest-route";

const BASE = "/booking-statuses";

export const bookingStatusRoutes = [
  restRoute({ operation: "bookingStatus.list", method: "GET", path: BASE }),
  restRoute({ operation: "bookingStatus.get", method: "GET", path: `${BASE}/{id}` }),
  restRoute({ operation: "bookingStatus.create", method: "POST", path: BASE }),
  restRoute({ operation: "bookingStatus.update", method: "PATCH", path: `${BASE}/{id}` }),
  restRoute({ operation: "bookingStatus.archive", method: "DELETE", path: `${BASE}/{id}` }),
  restRoute({ operation: "bookingStatus.reorder", method: "PUT", path: `${BASE}/order` }),
  restRoute({
    operation: "bookingStatus.setTransitions",
    method: "PUT",
    path: `${BASE}/{id}/transitions`,
  }),
  restRoute({
    operation: "bookingStatus.importTemplate",
    method: "POST",
    path: `${BASE}/import-template`,
  }),
];
