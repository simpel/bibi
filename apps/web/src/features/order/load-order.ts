import "server-only";
import { getOrder, type OrderDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadOrderCached = cache(async (id: string): Promise<Result<OrderDto>> => {
  return runOperation({ operation: getOrder, input: { id } });
});

export type LoadOrderInput = { id: string };

/** The order by its id, cached per request so metadata and page components share one read. */
export function loadOrder({ id }: LoadOrderInput): Promise<Result<OrderDto>> {
  return loadOrderCached(id);
}
