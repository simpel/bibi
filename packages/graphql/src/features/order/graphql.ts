import {
  changeOrderStatus,
  createOrder,
  createOrderFromTemplate,
  exportOrder,
  getOrder,
  listOrders,
  type OrderDto,
  type OrderEstimateHistory,
  OrderEstimateHistoryOutputSchema,
  type OrderExport,
  OrderExportOutputSchema,
  OrderSchema,
  type OrderStatusHistory,
  OrderStatusHistoryOutputSchema,
  type OrderViewDto,
  OrderViewSchema,
  orderEstimateHistory,
  orderStatusHistory,
  updateOrder,
  viewOrder,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { CustomerRef } from "../customer/graphql";
import { EntityTypeRef } from "../entity-type/graphql";
import { OrderStatusRef } from "../order-status/graphql";

export const OrderRef = objectFromSchema<OrderDto>({
  name: "Order",
  schema: OrderSchema,
  omit: ["organizationId"],
  description:
    "Order – one customer request from first contact to the delivered event (ADR 0043): type " +
    "and fields, customer and contact, desired period, headcount, budget, the " +
    "organization's own status and who answers for it (assignments).",
});
const OrderPageRef = pageType({ name: "OrderPage", item: OrderRef, withTotal: true });
const OrderExportRef = objectFromSchema<OrderExport>({
  name: "OrderExport",
  schema: OrderExportOutputSchema,
  description: "An order exported as a versioned document for handover outside the system.",
});

fieldFromOperation({ operation: listOrders, type: OrderPageRef, name: "orders" });
fieldFromOperation({ operation: getOrder, type: OrderRef, name: "order" });
const OrderViewRef = objectFromSchema<OrderViewDto>({
  name: "OrderView",
  schema: OrderViewSchema,
  omit: ["organizationId"],
  description:
    "One order as its page shows it (ADR 0071, 0097): its own fields plus status, customer, " +
    "people, program totals and balance, each null without that feature's read.",
});
fieldFromOperation({ operation: viewOrder, type: OrderViewRef, name: "orderView" });
const OrderStatusHistoryRef = objectFromSchema<OrderStatusHistory>({
  name: "OrderStatusHistory",
  schema: OrderStatusHistoryOutputSchema,
  description:
    "An order's status history, oldest first (ADR 0054), and the facts that contradict its status.",
});

fieldFromOperation({ operation: exportOrder, type: OrderExportRef, name: "orderExport" });
fieldFromOperation({
  operation: orderStatusHistory,
  type: OrderStatusHistoryRef,
  name: "orderStatusHistory",
});
const OrderEstimateHistoryRef = objectFromSchema<OrderEstimateHistory>({
  name: "OrderEstimateHistory",
  schema: OrderEstimateHistoryOutputSchema,
  description: "An order's value estimates, oldest first (ADR 0074).",
});
fieldFromOperation({
  operation: orderEstimateHistory,
  type: OrderEstimateHistoryRef,
  name: "orderEstimateHistory",
});
mutationFromOperation({ operation: createOrder, type: OrderRef });
mutationFromOperation({ operation: createOrderFromTemplate, type: OrderRef });
mutationFromOperation({ operation: updateOrder, type: OrderRef });
mutationFromOperation({ operation: changeOrderStatus, type: OrderRef });

builder.objectField(OrderRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The order type, with its fields.",
    resolve: (order, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: order.entityTypeId }) as never;
    },
  }),
);

builder.objectField(OrderRef, "customer", (t) =>
  t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer who orders (null if archived).",
    resolve: (order, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:read" });
      return ctx.loaders.customer.load({ id: order.customerId });
    },
  }),
);

builder.objectField(OrderRef, "orderStatus", (t) =>
  t.field({
    type: OrderStatusRef,
    description: "The order's status, with its flags (archived statuses included).",
    resolve: (order, _args, ctx) => {
      requirePermission({ ctx, permission: "pipeline:read" });
      return ctx.loaders.orderStatus.load({ id: order.statusId }) as never;
    },
  }),
);

builder.objectField(CustomerRef, "orders", (t) =>
  t.field({
    type: [OrderRef],
    description: "The customer's orders, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (customer, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listOrders,
        input: { customerId: customer.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: OrderDto[] };
      return page.items;
    },
  }),
);
