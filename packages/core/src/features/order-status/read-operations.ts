import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadAllOrderStatuses, loadOrderStatus } from "./load-order-status";
import {
  OrderStatusIdInputSchema,
  OrderStatusListInputSchema,
  OrderStatusListOutputSchema,
  OrderStatusSchema,
} from "./schema";

export const listOrderStatuses = defineOperation({
  name: "orderStatus.list",
  kind: "query",
  description:
    "List the organization's order statuses in board order, each with its flags (entry, " +
    "closing, invoiceable), the statuses an order may move to from it (`transitionsTo`; every " +
    "other status unless `restrictsNext`) and the gates on those moves (`transitionGates`: " +
    "REASON, ASSIGNEE, ACCEPTED_QUOTE). `gatesInto` lists the gates on moves into a status by source.",
  input: OrderStatusListInputSchema,
  output: OrderStatusListOutputSchema,
  permission: "pipeline:read",
  handler: async ({ input, context }) => {
    const page = await context.db.orderStatus.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true },
      ...pageArgs(input),
    });
    // Free statuses allow every other status, so each one is derived from the full set.
    const all = await loadAllOrderStatuses({ context });
    const statuses = page.flatMap(({ id }) => all.find((status) => status.id === id) ?? []);
    return ok({ value: paginate({ rows: statuses, limit: input.limit }) });
  },
});

export const getOrderStatus = defineOperation({
  name: "orderStatus.get",
  kind: "query",
  description: "Get one order status by id, with its flags and the statuses it may move to.",
  input: OrderStatusIdInputSchema,
  output: OrderStatusSchema,
  permission: "pipeline:read",
  handler: async ({ input, context }) => {
    const orderStatus = await loadOrderStatus({ context, id: input.id });
    return orderStatus ? ok({ value: orderStatus }) : notFound({ entity: "Order status" });
  },
});
