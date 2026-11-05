import "server-only";
import { getItemState, type ItemStateDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadItemStateCached = cache(async (id: string): Promise<Result<ItemStateDto>> => {
  return runOperation({ operation: getItemState, input: { id } });
});

export type LoadItemStateInput = { id: string };

/** The item state by its id, cached per request so metadata and page components share one read. */
export function loadItemState({ id }: LoadItemStateInput): Promise<Result<ItemStateDto>> {
  return loadItemStateCached(id);
}
