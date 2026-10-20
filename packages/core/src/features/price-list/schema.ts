import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/** One agreed price on a price list (ADR 0023). */
export const PriceListItemSchema = z.object({
  itemId: z.string().min(1).describe("Id of a PRICED item (item.list capability PRICED)"),
  priceMinor: z
    .number()
    .int()
    .min(0)
    .max(100_000_000)
    .describe("Agreed price in minor units (1/100 kr), in the item's own price unit"),
});

export const PriceListSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  customerId: z.string().nullable(),
  name: z.string(),
  validFrom: z.date().nullable(),
  validTo: z.date().nullable(),
  discountPercent: z.number().nullable(),
  items: z.array(PriceListItemSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const PriceListFieldsShape = {
  name: z.string().trim().min(1).max(200).describe("Name, e.g. the framework agreement it follows"),
  customerId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of the customer the prices apply to; null = a general price list"),
  validFrom: z.coerce.date().nullish().describe("First valid day (ISO 8601 date); null = open"),
  validTo: z.coerce.date().nullish().describe("Last valid day (ISO 8601 date); null = open"),
  discountPercent: z
    .number()
    .gt(0)
    .max(100)
    .multipleOf(0.01)
    .nullish()
    .describe("General discount in percent off item prices. Not combined with item prices"),
};

export const PriceListCreateInputSchema = z.object(PriceListFieldsShape);

export const PriceListUpdateInputSchema = PriceListCreateInputSchema.partial().extend({
  id: z.string().min(1),
});

export const PriceListIdInputSchema = z.object({ id: z.string().min(1) });

export const PriceListSetItemsInputSchema = z.object({
  id: z.string().min(1).describe("Id of the price list"),
  items: z
    .array(PriceListItemSchema)
    .max(500)
    .describe("The complete set of item prices; replaces the current set. Empty clears it"),
});

export const PriceListListInputSchema = z.object({
  customerId: z.string().optional().describe("Only price lists of this customer"),
  ...PageInputShape,
});

export const PriceListListOutputSchema = z.object({
  items: z.array(PriceListSchema),
  nextCursor: z.string().nullable(),
});

export type PriceListDto = z.infer<typeof PriceListSchema>;
export type PriceListItemDto = z.infer<typeof PriceListItemSchema>;
export type PriceListCreateInput = z.infer<typeof PriceListCreateInputSchema>;
export type PriceListUpdateInput = z.infer<typeof PriceListUpdateInputSchema>;
export type PriceListSetItemsInput = z.infer<typeof PriceListSetItemsInputSchema>;
