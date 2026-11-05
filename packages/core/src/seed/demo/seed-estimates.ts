import { ok, type Result } from "../../errors/result";
import { updateOrder } from "../../features/order/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrder } from "./order-types";

export type SeedEstimatesInput = { context: ExecuteContext; order: DemoOrder; orderId: string };

/**
 * The order's estimates in order (ADR 0074): the first at inquiry, then each re-estimate, each
 * through `order.update` so it lands in the estimate history.
 */
export async function seedOrderEstimates({
  context,
  order,
  orderId,
}: SeedEstimatesInput): Promise<Result<true>> {
  for (const kr of order.estimatesKr ?? []) {
    const input = { id: orderId, estimatedValueMinor: kr * 100 };
    const result = await execute({ operation: updateOrder, input, context });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
