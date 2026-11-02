import { WorkOrderSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a work order version as tool results carry it (dates = ISO strings). */
export const WorkOrderWireSchema = WorkOrderSchema.extend({
  sentAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const WorkOrderListWireSchema = z.object({
  items: z.array(WorkOrderWireSchema),
  nextCursor: z.string().nullable(),
});

export type WorkOrderWire = z.infer<typeof WorkOrderWireSchema>;

const workOrderTable = uiEntry({
  component: "work-order-table",
  schema: WorkOrderListWireSchema,
  toProps: ({ value }) => value,
});
const workOrderCard = uiEntry({
  component: "work-order-card",
  schema: WorkOrderWireSchema,
  toProps: ({ value }) => ({ workOrder: value }),
});

/** Tool → component for a ticket's versioned work orders with their ★ change markers (ADR 0021). */
export const WORK_ORDER_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  workOrder_list: workOrderTable,
  workOrder_get: workOrderCard,
  workOrder_generate: workOrderCard,
  workOrder_send: workOrderCard,
};
