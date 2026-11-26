import "server-only";
import { getReservation, type ReservationDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadCached = cache(
  (id: string): Promise<Result<ReservationDto>> =>
    runOperation({ operation: getReservation, input: { id } }),
);

/** One reservation, once per request (metadata and page share it). */
export const loadReservation = ({ id }: { id: string }) => loadCached(id);
