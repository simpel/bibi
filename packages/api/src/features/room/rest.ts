import { restRoute } from "../../rest-route";

export const roomRoutes = [
  restRoute({ operation: "room.list", method: "GET", path: "/rooms" }),
  restRoute({
    operation: "room.list",
    method: "GET",
    path: "/venues/{venueId}/rooms",
    operationId: "roomListByVenue",
  }),
  restRoute({ operation: "room.get", method: "GET", path: "/rooms/{id}" }),
  restRoute({
    operation: "room.create",
    method: "POST",
    path: "/venues/{venueId}/rooms",
    operationId: "roomCreate",
  }),
  restRoute({ operation: "room.update", method: "PATCH", path: "/rooms/{id}" }),
  restRoute({ operation: "room.archive", method: "DELETE", path: "/rooms/{id}" }),
];
