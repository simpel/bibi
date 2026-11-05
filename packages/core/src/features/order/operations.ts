import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import {
  draftOrderFromMessage,
  type ExtractFn,
  type ExtractInput,
  setExtract,
} from "../order-draft/operations";
import { changeOrderStatus } from "./change-status-operation";
import { createOrderFromTemplate } from "./create-from-template-operation";
import { orderEstimateHistory } from "./estimate-history-operation";
import { expireOrderHolds } from "./expire-holds-operation";
import { exportOrder } from "./export-operation";
import { loadOrderPage } from "./list-page";
import { OrderListInputSchema, OrderListOutputSchema } from "./list-schema";
import { previewOrderLines } from "./preview-lines-operation";
import { OrderIdInputSchema, OrderSchema } from "./schema";
import { orderStatusHistory } from "./status-history-operation";
import { loadOrder } from "./to-order-dto";
import { viewOrder } from "./view-operation";
import { createOrder, updateOrder } from "./write-operations";

export const listOrders = defineOperation({
  name: "order.list",
  kind: "query",
  description:
    "List the organization's orders, newest first. Filter by customer, type, status, assignee, " +
    "follower (assignment.list) or a window over the desired period (`from`/`to`); search with " +
    "`q` (reference, customer, contact or note) and order with `sort`/`direction`. Page with " +
    "`cursor`, or with `page` to get numbered pages and the `total` count.",
  input: OrderListInputSchema,
  output: OrderListOutputSchema,
  permission: "order:read",
  handler: async ({ input, context }) => ok({ value: await loadOrderPage({ input, context }) }),
});

export const getOrder = defineOperation({
  name: "order.get",
  kind: "query",
  description:
    "Get one order by id: reference number, type and its field values, customer, contact, " +
    "desired period, headcount, budget and status (with the reason of the last move). " +
    "Who answers for it: assignment.list.",
  input: OrderIdInputSchema,
  output: OrderSchema,
  permission: "order:read",
  handler: async ({ input, context }) => {
    const order = await loadOrder({ context, id: input.id });
    return order ? ok({ value: order }) : notFound({ entity: "Order" });
  },
});

export const orderOperations = [
  listOrders,
  getOrder,
  viewOrder,
  createOrder,
  updateOrder,
  changeOrderStatus,
  createOrderFromTemplate,
  previewOrderLines,
  exportOrder,
  expireOrderHolds,
  orderStatusHistory,
  orderEstimateHistory,
  draftOrderFromMessage,
];

export type { ExtractFn, ExtractInput };
// The draft read from a message starts an order (ADR 0084): public here with the port it reads through.
export { draftOrderFromMessage, orderEstimateHistory, previewOrderLines, setExtract, viewOrder };
