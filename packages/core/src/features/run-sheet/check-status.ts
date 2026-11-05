import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

export type CheckStatusInput = { context: Pick<OperationContext, "db">; orderId: string };

/**
 * Run sheets go out only while the order is open (ADR 0043): an order in a closing status is over,
 * its lines are released and nothing is sent for it any more.
 */
export async function checkStatus({ context, orderId }: CheckStatusInput): Promise<Result<true>> {
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: { orderStatus: { select: { closes: true, name: true } } },
  });
  if (order && !order.orderStatus.closes) return ok({ value: true });
  const name = order?.orderStatus.name ?? "unknown";
  return conflict({ message: `RunSheets cannot be sent for a closed order (status "${name}")` });
}
