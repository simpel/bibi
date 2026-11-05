import "server-only";
import { getItem, type ItemDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadItemCached = cache(async (id: string): Promise<Result<ItemDto>> => {
  return runOperation({ operation: getItem, input: { id } });
});

export type LoadItemInput = { id: string };

/** The item by its id, cached per request so metadata and page components share one read. */
export function loadItem({ id }: LoadItemInput): Promise<Result<ItemDto>> {
  return loadItemCached(id);
}
