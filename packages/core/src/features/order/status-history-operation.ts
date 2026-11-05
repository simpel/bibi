import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import {
  OrderStatusHistoryInputSchema,
  OrderStatusHistoryOutputSchema,
} from "./status-history-schema";
import { statusWarnings } from "./status-warnings";

export const orderStatusHistory = defineOperation({
  name: "order.statusHistory",
  kind: "query",
  description:
    "The order's status history, oldest first (ADR 0054): every status it entered, from which " +
    "status, why (reason), what made the move (MANUAL, QUOTE_EVENT, TEMPLATE or SYSTEM), when " +
    "and by whom. Time in a status is the gap to the next entry. `warnings` lists facts that " +
    "contradict the status, e.g. an accepted quote while the order is in an earlier status.",
  input: OrderStatusHistoryInputSchema,
  output: OrderStatusHistoryOutputSchema,
  permission: "order:read",
  handler: async ({ input: { orderId }, context }) => {
    const order = await context.db.order.findFirst({
      where: { id: orderId },
      select: { id: true, statusId: true },
    });
    if (!order) return notFound({ entity: "Order" });
    const items = await context.db.orderStatusChange.findMany({
      where: { orderId },
      orderBy: { seq: "asc" },
      select: {
        ...{ id: true, orderId: true, fromStatusId: true, toStatusId: true, reason: true },
        ...{ trigger: true, changedAt: true, changedBy: true },
      },
    });
    const warnings = await statusWarnings({ context, orderId, statusId: order.statusId });
    return ok({ value: { items, warnings } });
  },
});
