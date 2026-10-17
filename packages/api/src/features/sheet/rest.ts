import { restRoute } from "../../rest-route";

export const sheetRoutes = [
  restRoute({ operation: "sheet.list", method: "GET", path: "/sheets" }),
  restRoute({
    operation: "sheet.list",
    method: "GET",
    path: "/bookings/{bookingId}/sheets",
    operationId: "sheetListByBooking",
  }),
  restRoute({ operation: "sheet.get", method: "GET", path: "/sheets/{id}" }),
  restRoute({ operation: "sheet.generate", method: "POST", path: "/sheets" }),
  restRoute({ operation: "sheet.send", method: "POST", path: "/sheets/{id}/send" }),
];
