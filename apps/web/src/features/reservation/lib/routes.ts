import { ROUTES } from "@/lib/routes";

export type DayRouteInput = { date: string; room?: string | undefined };

const withRoom = ({ path, room }: { path: string; room: string | undefined }) =>
  room ? `${path}?room=${encodeURIComponent(room)}` : path;

/** `/reservations/day/{date}`: the list of one local day (the date is in the path, ADR 0064). */
export const dayRoute = ({ date, room }: DayRouteInput) =>
  withRoom({ path: `${ROUTES.reservations}/day/${date}`, room });

/** `/reservations/{id}`: one reservation. */
export const reservationRoute = ({ id }: { id: string }) =>
  `${ROUTES.reservations}/${encodeURIComponent(id)}`;
