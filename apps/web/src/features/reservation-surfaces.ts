import type { WebSurface } from "./web-surfaces";

const DAY = "/reservations/day/[date]";
const ONE = "/reservations/[id]";

/** Table reservations and blocks (ADR 0119): the staff day view and the reservation page. */
export const RESERVATION_SURFACES: readonly WebSurface[] = [
  { operation: "reservation.dayView", route: DAY },
  { operation: "reservation.list", route: DAY },
  { operation: "reservation.get", route: ONE },
  { operation: "reservation.availability", route: DAY },
  { operation: "reservation.create", route: DAY },
  { operation: "reservation.update", route: ONE },
  { operation: "reservation.cancel", route: ONE },
  { operation: "reservation.seat", route: ONE },
  { operation: "reservation.unseat", route: ONE },
  { operation: "reservation.complete", route: ONE },
  { operation: "reservation.markNoShow", route: ONE },
  { operation: "tableBlock.list", route: DAY },
  { operation: "tableBlock.create", route: DAY },
  { operation: "tableBlock.delete", route: DAY },
];
