import { restRoute } from "../../rest-route";

export const bookingRoutes = [
  restRoute({ operation: "booking.list", method: "GET", path: "/bookings" }),
  restRoute({ operation: "booking.get", method: "GET", path: "/bookings/{id}" }),
  restRoute({ operation: "booking.create", method: "POST", path: "/bookings" }),
  restRoute({ operation: "booking.createQuick", method: "POST", path: "/bookings/quick" }),
  restRoute({ operation: "booking.update", method: "PATCH", path: "/bookings/{id}" }),
  restRoute({ operation: "booking.assign", method: "PUT", path: "/bookings/{id}/owners" }),
  restRoute({
    operation: "booking.changeStatus",
    method: "POST",
    path: "/bookings/{bookingId}/status",
  }),
];
