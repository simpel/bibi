import { WorkOrderDefinitionSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a work order definition as tool results carry it (dates = ISO strings). */
export const WorkOrderDefinitionWireSchema = WorkOrderDefinitionSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const WorkOrderDefinitionListWireSchema = z.object({
  items: z.array(WorkOrderDefinitionWireSchema),
  nextCursor: z.string().nullable(),
});

export type WorkOrderDefinitionWire = z.infer<typeof WorkOrderDefinitionWireSchema>;

const workOrderTable = uiEntry({
  component: "work-order-definition-table",
  schema: WorkOrderDefinitionListWireSchema,
  toProps: ({ value }) => value,
});
const workOrderCard = uiEntry({
  component: "work-order-definition-card",
  schema: WorkOrderDefinitionWireSchema,
  toProps: ({ value }) => ({ workOrder: value }),
});

/** Tool → component for the organization's work order definitions (ADR 0021). */
export const WORK_ORDER_DEFINITION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  workOrderDefinition_list: workOrderTable,
  workOrderDefinition_get: workOrderCard,
  workOrderDefinition_create: workOrderCard,
  workOrderDefinition_update: workOrderCard,
  workOrderDefinition_archive: workOrderCard,
};
