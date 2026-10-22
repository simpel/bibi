import { PriceListSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a price list as tool results carry it (dates = ISO strings). */
export const PriceListWireSchema = PriceListSchema.extend({
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const PriceListListWireSchema = z.object({
  items: z.array(PriceListWireSchema),
  nextCursor: z.string().nullable(),
});

export type PriceListWire = z.infer<typeof PriceListWireSchema>;

const priceListTable = uiEntry({
  component: "price-list-table",
  schema: PriceListListWireSchema,
  toProps: ({ value }) => value,
});
const priceListCard = uiEntry({
  component: "price-list-card",
  schema: PriceListWireSchema,
  toProps: ({ value }) => ({ priceList: value }),
});

/** Tool → component for customer price lists (ADR 0023). */
export const PRICE_LIST_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  priceList_list: priceListTable,
  priceList_get: priceListCard,
  priceList_create: priceListCard,
  priceList_update: priceListCard,
  priceList_setItems: priceListCard,
  priceList_archive: priceListCard,
};
