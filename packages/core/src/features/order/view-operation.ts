import { ok } from "../../errors/result";
import { DEFAULT_CURRENCY } from "../../number/number-formats";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { loadViewDetails } from "./load-view-details";
import { OrderIdInputSchema } from "./schema";
import { loadOrder } from "./to-order-dto";
import { OrderViewSchema } from "./view-schema";

export const viewOrder = defineOperation({
  name: "order.view",
  kind: "query",
  description:
    "Everything about one order in one call: prefer it to answer 'what is the status of order " +
    "#N' or to summarise an order (find the id with order.list, q = the reference). The order's own fields (as order.get) plus guestCount and " +
    "the main assignee and followers by name, joined with other features' data, each null " +
    "without that feature's read (ADR 0071): currentStatus name and colour (pipeline:read); " +
    "customer name and contact name, email and phone (customer:read); program: line count, " +
    "total excl. and incl. VAT as a draft quote counts it and the number of open line issues " +
    "(program:read); balance: billed, paid and open (payment:read). Writes nothing.",
  input: OrderIdInputSchema,
  output: OrderViewSchema,
  permission: "order:read",
  // A view read model (ADR 0071, 0097): other features' fields are gated in load-view-details.
  entityType: "order",
  handler: async ({ input, context }) => {
    const order = await loadOrder({ context, id: input.id });
    if (!order) return notFound({ entity: "Order" });
    const details = await loadViewDetails({ context, order });
    const guestCount = order.guaranteedHeadcount ?? order.estimatedHeadcount;
    return ok({ value: { ...order, guestCount, currency: DEFAULT_CURRENCY, ...details } });
  },
});
