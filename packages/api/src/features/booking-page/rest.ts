import { restRoute } from "../../rest-route";

export const bookingPageRoutes = [
  restRoute({ operation: "bookingPage.get", method: "GET", path: "/booking-page" }),
  restRoute({ operation: "bookingPage.update", method: "PATCH", path: "/booking-page" }),
];
