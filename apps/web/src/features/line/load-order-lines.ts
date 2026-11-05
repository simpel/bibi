import "server-only";
import { type LineDto, listLines, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const LIMIT = 100;

const loadOrderLinesCached = cache(
  async (orderId: string): Promise<Result<{ items: LineDto[]; nextCursor?: string | null }>> => {
    return runOperation({ operation: listLines, input: { orderId, limit: LIMIT } });
  },
);

export type LoadOrderLinesInput = { orderId: string };

/**
 * An order's lines, cached per request so the issue alerts, program table,
 * alternative groups, and requirements share one read.
 */
export function loadOrderLines({
  orderId,
}: LoadOrderLinesInput): Promise<Result<{ items: LineDto[]; nextCursor?: string | null }>> {
  return loadOrderLinesCached(orderId);
}
