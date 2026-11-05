import "server-only";
import { getResponsibility, type ResponsibilityDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadResponsibilityCached = cache(async (id: string): Promise<Result<ResponsibilityDto>> => {
  return runOperation({ operation: getResponsibility, input: { id } });
});

export type LoadResponsibilityInput = { id: string };

/** The responsibility by its id, cached per request so metadata and page components share one read. */
export function loadResponsibility({
  id,
}: LoadResponsibilityInput): Promise<Result<ResponsibilityDto>> {
  return loadResponsibilityCached(id);
}
