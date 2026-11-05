import {
  OrderEstimateHistoryOutputSchema,
  OrderEstimateSchema,
  OrderSchema,
  OrderStatusChangeSchema,
  OrderStatusHistoryOutputSchema,
  OrderViewSchema,
} from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an order as tool results carry it (dates = ISO strings). */
export const OrderWireSchema = OrderSchema.extend({
  desiredStartsAt: z.string().nullable(),
  desiredEndsAt: z.string().nullable(),
  holdsUntil: z.string().nullable(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const OrderListWireSchema = z.object({
  items: z.array(OrderWireSchema),
  nextCursor: z.string().nullable(),
});

export type OrderWire = z.infer<typeof OrderWireSchema>;

/** JSON form of an order's status history (ADR 0054). */
export const OrderStatusHistoryWireSchema = OrderStatusHistoryOutputSchema.extend({
  items: z.array(OrderStatusChangeSchema.extend({ changedAt: z.string() })),
});

export type OrderStatusHistoryWire = z.infer<typeof OrderStatusHistoryWireSchema>;

/** JSON form of an order's estimate history (ADR 0074). */
export const OrderEstimateHistoryWireSchema = OrderEstimateHistoryOutputSchema.extend({
  items: z.array(OrderEstimateSchema.extend({ changedAt: z.string() })),
});

export type OrderEstimateHistoryWire = z.infer<typeof OrderEstimateHistoryWireSchema>;

/** JSON form of `order.view` (ADR 0071, 0097): the order with its gated joins. */
export const OrderViewWireSchema = OrderViewSchema.extend(OrderWireSchema.shape);

export type OrderViewWire = z.infer<typeof OrderViewWireSchema>;

/** The props of the order components, part of `ToolUiProps`. */
export type OrderToolUiProps = {
  "order-table": { items: OrderWire[]; nextCursor: string | null };
  "order-card": { order: OrderWire };
  "order-view": { order: OrderViewWire };
  "order-status-history": { history: OrderStatusHistoryWire };
  "order-estimate-history": { history: OrderEstimateHistoryWire };
};

const orderTable = uiEntry({
  component: "order-table",
  schema: OrderListWireSchema,
  toProps: ({ value }) => value,
});
const orderCard = uiEntry({
  component: "order-card",
  schema: OrderWireSchema,
  toProps: ({ value }) => ({ order: value }),
});

/** Tool → component for orders (ADR 0043). */
export const ORDER_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  order_list: orderTable,
  order_get: orderCard,
  order_view: uiEntry({
    component: "order-view",
    schema: OrderViewWireSchema,
    toProps: ({ value }) => ({ order: value }),
  }),
  order_create: orderCard,
  order_createFromTemplate: orderCard,
  order_update: orderCard,
  order_changeStatus: orderCard,
  order_statusHistory: uiEntry({
    component: "order-status-history",
    schema: OrderStatusHistoryWireSchema,
    toProps: ({ value }) => ({ history: value }),
  }),
  order_estimateHistory: uiEntry({
    component: "order-estimate-history",
    schema: OrderEstimateHistoryWireSchema,
    toProps: ({ value }) => ({ history: value }),
  }),
};
