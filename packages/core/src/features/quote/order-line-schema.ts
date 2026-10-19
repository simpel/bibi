import { z } from "zod";
import { PriceUnitSchema } from "../item/schema";

/** A list value an order line's item contained when the line was made (snapshot). */
export const OrderLineTagSchema = z.object({
  valueId: z.string(),
  vocabularyId: z.string(),
  name: z.string(),
});

/**
 * What is charged for one priced ticket line (ADR 0052): its name, effective price, VAT and the
 * item's tags. Frozen on a sent quote; on a DRAFT derived live from the line (`id` = `lineId`).
 */
export const OrderLineSchema = z.object({
  id: z.string(),
  lineId: z.string().describe("The ticket line (line.get) this is the price of"),
  itemId: z.string().nullable(),
  position: z.number().int().describe("Order on the quote, from 0"),
  name: z.string().describe("The line's name"),
  quantity: z.number().int().describe("The line's effective quantity (0 while it has none)"),
  unitPriceMinor: z.number().int().describe("Price per unit in minor units (1/100 kr)"),
  priceUnit: PriceUnitSchema.nullable(),
  discountPercent: z.number(),
  vatRatePercent: z.number().int(),
  tags: z
    .array(OrderLineTagSchema)
    .describe("List values the item contained (item.resolve `contains`), e.g. allergens"),
  totalExclVatMinor: z.number().int().describe("quantity × unit price − discount, minor units"),
  vatMinor: z.number().int().describe("VAT on the line total, minor units"),
});

export type OrderLineTag = z.infer<typeof OrderLineTagSchema>;
export type OrderLineDto = z.infer<typeof OrderLineSchema>;
