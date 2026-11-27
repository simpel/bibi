import { viewReservationDay } from "./day-view-operation";
import { getReservation, listReservations, reservationAvailability } from "./read-operations";
import { reservationStateOperations } from "./state-operations";
import { createReservation, updateReservation } from "./write-operations";

/** Staff operations on table reservations (ADR 0119); every surface. */
export const reservationOperations = [
  listReservations,
  getReservation,
  reservationAvailability,
  viewReservationDay,
  createReservation,
  updateReservation,
  ...reservationStateOperations,
];
