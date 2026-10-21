import { z } from "zod";
import { PriceUnitSchema } from "../item/schema";

/** A list value an order line's item contained when the line was made (snapshot). */
export const OrderLineTagSchema = z.object({
  valueId: z.string(),
  vocabularyId: z.string(),
  name: z.string(),
});

/** The VAT of one rate on an order line (ADR 0059): the part of the total at that rate. */
export const VatRowSchema = z.object({
  vatRatePercent: z.number().int(),
  totalExclVatMinor: z.number().int().describe("The part of the line total at this rate"),
  vatMinor: z.number().int().describe("VAT at this rate, minor units"),
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
  vatMinor: z.number().int().describe("VAT on the line total, minor units: the sum of vatRows"),
  vatRows: z
    .array(VatRowSchema)
    .describe(
      "VAT per rate: one row for an ordinary line; for a bundle line one per rate of its parts, " +
        "its price allocated across them by effective price × quantity (ADR 0059)",
    ),
  parentLineId: z
    .string()
    .nullable()
    .describe("The bundle line (line.get) of a part line, which never counts in the totals"),
  alternativeGroupId: z
    .string()
    .nullable()
    .describe("The alternative group (alternativeGroup.get) the line is an option of (ADR 0052)"),
  alternativeGroupName: z
    .string()
    .nullable()
    .describe("The group's name; null on an ordinary line"),
  alternativeGroupChosen: z
    .boolean()
    .nullable()
    .describe("Whether the group had a chosen option; null on an ordinary line"),
  inTotal: z
    .boolean()
    .describe(
      "Counts in the quote's totals: false for a part line (its bundle line carries the price) " +
        "and for a group's options other than the chosen one (or, until one is chosen, other " +
        "than the cheapest one)",
    ),
});

export type OrderLineTag = z.infer<typeof OrderLineTagSchema>;
export type VatRow = z.infer<typeof VatRowSchema>;
export type OrderLineDto = z.infer<typeof OrderLineSchema>;
