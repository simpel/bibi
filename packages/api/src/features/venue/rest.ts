import { restRoute } from "../../rest-route";

export const venueRoutes = [
  restRoute({ operation: "venue.list", method: "GET", path: "/venues" }),
  restRoute({ operation: "venue.get", method: "GET", path: "/venues/{id}" }),
  restRoute({ operation: "venue.create", method: "POST", path: "/venues" }),
  restRoute({ operation: "venue.update", method: "PATCH", path: "/venues/{id}" }),
  restRoute({ operation: "venue.archive", method: "DELETE", path: "/venues/{id}" }),
];
