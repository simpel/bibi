import "server-only";
import { getVenue, type Result, type VenueDto } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadVenueCached = cache(async (id: string): Promise<Result<VenueDto>> => {
  return runOperation({ operation: getVenue, input: { id } });
});

export type LoadVenueInput = { id: string };

/** The venue by its id, cached per request so metadata and page components share one read. */
export function loadVenue({ id }: LoadVenueInput): Promise<Result<VenueDto>> {
  return loadVenueCached(id);
}
