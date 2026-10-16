import { z } from "zod";
import { PriceUnitSchema } from "../item/schema";

/** A list value an order line's item contained when the line was made (snapshot). */
export const OrderLineTagSchema = z.object({
  valueId: z.string(),
  vocabularyId: z.string(),
  name: z.string(),
});

/** What is charged: a snapshot of the item's name, price, VAT and tags (ADR 0021, 0022). */
export const OrderLineSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  position: z.number().int().describe("Order on the quote, from 0"),
  name: z.string().describe("The item's name when the line was made"),
  quantity: z.number().int(),
  unitPriceMinor: z.number().int().describe("Price per unit in minor units (1/100 kr)"),
  priceUnit: PriceUnitSchema.nullable(),
  discountPercent: z.number().int(),
  vatRatePercent: z.number().int(),
  tags: z
    .array(OrderLineTagSchema)
    .describe("List values the item contained (item.resolve `contains`), e.g. allergens"),
  totalExclVatMinor: z.number().int().describe("quantity × unit price − discount, minor units"),
  vatMinor: z.number().int().describe("VAT on the line total, minor units"),
});

export const OrderLineInputSchema = z.object({
  lineId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Id of a line already on this draft to keep its snapshot (name, VAT, tags, price unless " +
        "given); omit for a new line copied from the item",
    ),
  itemId: z.string().min(1).describe("Id of an active item (item.list) to charge"),
  quantity: z.number().int().min(1).max(100_000).describe("How many, in the item's price unit"),
  unitPriceMinor: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Price per unit in minor units; default the item's own price"),
  discountPercent: z.number().int().min(0).max(100).optional().describe("Discount, default 0"),
});

export type OrderLineTag = z.infer<typeof OrderLineTagSchema>;
export type OrderLineDto = z.infer<typeof OrderLineSchema>;
export type OrderLineInput = z.infer<typeof OrderLineInputSchema>;
