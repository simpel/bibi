import { restRoute } from "../../rest-route";

export const bookingSeriesRoutes = [
  restRoute({ operation: "bookingSeries.list", method: "GET", path: "/booking-series" }),
  restRoute({ operation: "bookingSeries.get", method: "GET", path: "/booking-series/{id}" }),
  restRoute({ operation: "bookingSeries.create", method: "POST", path: "/booking-series" }),
  restRoute({
    operation: "bookingSeries.updateOccurrences",
    method: "PATCH",
    path: "/booking-series/{seriesId}/occurrences",
  }),
  restRoute({
    operation: "bookingSeries.cancel",
    method: "POST",
    path: "/booking-series/{id}/cancel",
  }),
];
