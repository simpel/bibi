import "server-only";
import { listOrderVersions, type OrderVersionList, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

/**
 * The order's versions (ADR 0116), read once per request: the program's sync line and the
 * Versions section share it.
 */
export const loadOrderVersions = cache(
  (orderId: string): Promise<Result<OrderVersionList>> =>
    runOperation({ operation: listOrderVersions, input: { orderId } }),
);
