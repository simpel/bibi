import { ok } from "../../errors/result";
import { changeOrderStatus } from "../../features/order/change-status-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { atDay } from "./seed-clock";
import { missing } from "./seed-fields";
import { seedOrderQuote } from "./seed-order-quote";
import type { DemoOrder } from "./order-types";

export type MoveStatusInput = {
  context: ExecuteContext;
  order: DemoOrder;
  orderId: string;
  now: Date;
};

/**
 * Brings the new order to its status in the spec (ADR 0043). A status with a quote event is
 * reached through the order's quote (`quote.send`, `quote.accept`); any other through
 * `order.changeStatus`.
 */
export async function moveStatus({ context: live, order, orderId, now }: MoveStatusInput) {
  // A past event closes on its own day (ADR 0064 clock), so the history has real months.
  const context = atDay({ context: live, now, day: order.day <= 0 ? order.day : undefined });
  // An order made from a predefined order already starts in its status.
  if (!order.status || order.template) return ok({ value: true });
  const orderStatus = await context.db.orderStatus.findFirst({
    where: { name: order.status },
  });
  if (!orderStatus) return missing({ what: `order status ${order.status}` });
  if (order.won) {
    // ADR 0079: a won order reaches its closing status through an accepted quote.
    const accepted = await seedOrderQuote({
      context,
      order,
      orderId,
      event: "QUOTE_ACCEPTED",
      now,
    });
    if (!accepted.ok) return accepted;
  } else if (orderStatus.event) {
    return seedOrderQuote({ context, order, orderId, event: orderStatus.event, now });
  }
  const input = { orderId, statusId: orderStatus.id, reason: order.reason };
  return execute({ operation: changeOrderStatus, input, context });
}
