import { OrderStatusSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { archivePreviewEntry } from "./archive-preview-entry";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an order status as tool results carry it (dates = ISO strings). */
export const OrderStatusWireSchema = OrderStatusSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const OrderStatusListWireSchema = z.object({
  items: z.array(OrderStatusWireSchema),
  nextCursor: z.string().nullable(),
});
/** `orderStatus_importTemplate` output: the statuses it created. */
export const OrderStatusImportWireSchema = z.object({
  created: z.array(OrderStatusWireSchema),
  skipped: z.array(z.string()),
  gatesAdded: z.number(),
});

export type OrderStatusWire = z.infer<typeof OrderStatusWireSchema>;

const statusTable = uiEntry({
  component: "order-status-table",
  schema: OrderStatusListWireSchema,
  toProps: ({ value }) => value,
});
const statusCard = uiEntry({
  component: "order-status-card",
  schema: OrderStatusWireSchema,
  toProps: ({ value }) => ({ orderStatus: value }),
});

/** Tool → component for the organization's order statuses (ADR 0043). */
export const ORDER_STATUS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  orderStatus_list: statusTable,
  orderStatus_get: statusCard,
  orderStatus_create: statusCard,
  orderStatus_update: statusCard,
  orderStatus_archive: statusCard,
  orderStatus_archivePreview: archivePreviewEntry,
  orderStatus_reorder: statusTable,
  orderStatus_setTransitions: statusCard,
  orderStatus_setGates: statusCard,
  orderStatus_importTemplate: uiEntry({
    component: "order-status-table",
    schema: OrderStatusImportWireSchema,
    toProps: ({ value }) => ({ items: value.created, nextCursor: null }),
  }),
};
