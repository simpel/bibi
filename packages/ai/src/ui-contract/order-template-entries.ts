import { OrderTemplateSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a predefined order as tool results carry it (dates = ISO strings). */
export const OrderTemplateWireSchema = OrderTemplateSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const OrderTemplateListWireSchema = z.object({
  items: z.array(OrderTemplateWireSchema),
  nextCursor: z.string().nullable(),
});

export type OrderTemplateWire = z.infer<typeof OrderTemplateWireSchema>;

const templateTable = uiEntry({
  component: "order-template-table",
  schema: OrderTemplateListWireSchema,
  toProps: ({ value }) => value,
});
const templateCard = uiEntry({
  component: "order-template-card",
  schema: OrderTemplateWireSchema,
  toProps: ({ value }) => ({ template: value }),
});

/** Tool → component for the organization's predefined orders (ADR 0043). */
export const ORDER_TEMPLATE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  orderTemplate_list: templateTable,
  orderTemplate_get: templateCard,
  orderTemplate_create: templateCard,
  orderTemplate_update: templateCard,
  orderTemplate_archive: templateCard,
};
