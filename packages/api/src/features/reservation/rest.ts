import { restRoute } from "../../rest-route";

export const reservationRoutes = [
  restRoute({ operation: "reservation.list", method: "GET", path: "/reservations" }),
  restRoute({ operation: "reservation.dayView", method: "GET", path: "/reservations/day-view" }),
  restRoute({ operation: "reservation.get", method: "GET", path: "/reservations/{id}" }),
  restRoute({
    operation: "reservation.availability",
    method: "GET",
    path: "/dining-rooms/{roomItemId}/availability",
  }),
  restRoute({
    operation: "reservation.calendar",
    method: "GET",
    path: "/dining-rooms/{roomItemId}/calendar",
  }),
  restRoute({ operation: "reservation.create", method: "POST", path: "/reservations" }),
  restRoute({ operation: "reservation.update", method: "PATCH", path: "/reservations/{id}" }),
  restRoute({
    operation: "reservation.cancel",
    method: "POST",
    path: "/reservations/{id}/cancel",
    successStatus: 200,
  }),
  restRoute({
    operation: "reservation.seat",
    method: "POST",
    path: "/reservations/{id}/seat",
    successStatus: 200,
  }),
  restRoute({
    operation: "reservation.unseat",
    method: "POST",
    path: "/reservations/{id}/unseat",
    successStatus: 200,
  }),
  restRoute({
    operation: "reservation.complete",
    method: "POST",
    path: "/reservations/{id}/complete",
    successStatus: 200,
  }),
  restRoute({
    operation: "reservation.markNoShow",
    method: "POST",
    path: "/reservations/{id}/no-show",
    successStatus: 200,
  }),
  restRoute({
    operation: "reservation.revertNoShow",
    method: "POST",
    path: "/reservations/{id}/revert-no-show",
    successStatus: 200,
  }),
];
