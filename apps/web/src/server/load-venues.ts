import "server-only";
import { listVenues, type Result, type VenueDto } from "@bibi/core";
import { cache } from "react";
import { listAll } from "./list-all";

/** Every venue of the organization, read once per request (ADR 0097 §3). */
export const loadVenues = cache(async (): Promise<Result<VenueDto[]>> => {
  return listAll({ operation: listVenues, input: {} });
});
