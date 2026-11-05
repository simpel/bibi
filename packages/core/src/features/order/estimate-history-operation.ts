import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import {
  OrderEstimateHistoryInputSchema,
  OrderEstimateHistoryOutputSchema,
} from "./estimate-history-schema";

export const orderEstimateHistory = defineOperation({
  name: "order.estimateHistory",
  kind: "query",
  description:
    "The order's value estimates, oldest first (ADR 0074): every estimated value excl. VAT it " +
    "was given (order.create, order.update), when and by whom. The first entry is the first " +
    "estimate and the last the current one; compare them with the accepted quote's total to see " +
    "how far off the estimates were.",
  input: OrderEstimateHistoryInputSchema,
  output: OrderEstimateHistoryOutputSchema,
  permission: "order:read",
  handler: async ({ input: { orderId }, context }) => {
    const order = await context.db.order.findFirst({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) return notFound({ entity: "Order" });
    const items = await context.db.orderEstimate.findMany({
      where: { orderId },
      orderBy: { seq: "asc" },
      select: { id: true, orderId: true, valueMinor: true, changedAt: true, changedBy: true },
    });
    return ok({ value: { items } });
  },
});
