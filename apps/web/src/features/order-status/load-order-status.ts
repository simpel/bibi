import "server-only";
import { getOrderStatus, type OrderStatusDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadOrderStatusCached = cache(async (id: string): Promise<Result<OrderStatusDto>> => {
  return runOperation({ operation: getOrderStatus, input: { id } });
});

export type LoadOrderStatusInput = { id: string };

/** The order status by its id, cached per request so metadata and page components share one read. */
export function loadOrderStatus({ id }: LoadOrderStatusInput): Promise<Result<OrderStatusDto>> {
  return loadOrderStatusCached(id);
}
