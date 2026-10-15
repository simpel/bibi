import { restRoute } from "../../rest-route";

export const inboundEmailRoutes = [
  restRoute({
    operation: "inboundEmail.list",
    method: "GET",
    path: "/bookings/{bookingId}/inbound-emails",
  }),
  restRoute({ operation: "inboundEmail.get", method: "GET", path: "/inbound-emails/{id}" }),
];
