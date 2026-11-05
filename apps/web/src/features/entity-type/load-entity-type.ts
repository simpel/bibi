import "server-only";
import { type EntityTypeDto, getEntityType, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadEntityTypeCached = cache(async (id: string): Promise<Result<EntityTypeDto>> => {
  return runOperation({ operation: getEntityType, input: { id } });
});

export type LoadEntityTypeInput = { id: string };

/** The type by its id, cached per request so metadata and page components share one read. */
export function loadEntityType({ id }: LoadEntityTypeInput): Promise<Result<EntityTypeDto>> {
  return loadEntityTypeCached(id);
}
