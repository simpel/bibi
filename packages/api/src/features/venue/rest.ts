import { restRoute } from "../../rest-route";

export const venueRoutes = [
  restRoute({ operation: "venue.list", method: "GET", path: "/venues" }),
  restRoute({ operation: "venue.get", method: "GET", path: "/venues/{id}" }),
  restRoute({ operation: "venue.create", method: "POST", path: "/venues" }),
  restRoute({ operation: "venue.update", method: "PATCH", path: "/venues/{id}" }),
  restRoute({ operation: "venue.archive", method: "DELETE", path: "/venues/{id}" }),
  restRoute({ operation: "venueHours.get", method: "GET", path: "/venues/{venueId}/hours" }),
  // Several venues at once (ADR 0097): `?venueIds=a&venueIds=b`.
  restRoute({ operation: "venue.hoursList", method: "GET", path: "/venue-hours" }),
  restRoute({ operation: "venueHours.set", method: "PUT", path: "/venues/{venueId}/hours" }),
];
