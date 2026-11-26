import { restRoute } from "../rest-route";

/** The guest REST surface: keyed by the page slug (public) or the guest's manage token. */
export const PUBLIC_ROUTES = [
  restRoute({ operation: "bookingPage.publicGet", method: "GET", path: "/pages/{slug}" }),
  restRoute({
    operation: "reservation.publicAvailability",
    method: "GET",
    path: "/pages/{slug}/rooms/{roomSlug}/availability",
  }),
  restRoute({
    operation: "reservation.publicCreate",
    method: "POST",
    path: "/pages/{slug}/rooms/{roomSlug}/reservations",
  }),
  restRoute({ operation: "reservation.publicGet", method: "GET", path: "/reservations/{token}" }),
  restRoute({
    operation: "reservation.publicChange",
    method: "PATCH",
    path: "/reservations/{token}",
  }),
  restRoute({
    operation: "reservation.publicCancel",
    method: "POST",
    path: "/reservations/{token}/cancel",
    successStatus: 200,
  }),
];
